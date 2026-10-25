"""Download only the EMA weights from a remote PyTorch training checkpoint.

A torch.save() file is a zip with one entry per tensor storage. This reads the
zip's directory and data.pkl over HTTP range requests, finds the storages that
belong to `ema_model_state_dict`, downloads just those, and saves them as a
small checkpoint F5-TTS can load. The optimizer state and the raw weights are
skipped, which cuts a 5.4 GB F5 checkpoint to about a quarter.

Usage: python fetch_ema.py <url> <out.pt> [--list]
"""
import argparse
import collections
import concurrent.futures
import io
import os
import pickle
import sys
import threading
import time
import urllib.request
import zipfile

import torch

parser = argparse.ArgumentParser()
parser.add_argument("url")
parser.add_argument("out")
parser.add_argument("--list", action="store_true", help="print the checkpoint layout and stop")
parser.add_argument("--key", default="ema_model_state_dict")
args = parser.parse_args()


def get(start, end):
    """Bytes start..end (inclusive), retrying on dropped connections."""
    for attempt in range(1000):
        try:
            req = urllib.request.Request(args.url, headers={"Range": f"bytes={start}-{end}"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if len(data) == end - start + 1:
                return data
        except Exception as e:  # noqa: BLE001 - network errors are retried
            print(f"  retry {attempt + 1} for {start}-{end}: {e}", file=sys.stderr)
        time.sleep(min(30, 2 + attempt * 3))
    raise RuntimeError(f"could not fetch bytes {start}-{end}")


class RemoteFile(io.RawIOBase):
    """A seekable read-only file over HTTP ranges, enough for zipfile."""

    def __init__(self):
        with urllib.request.urlopen(urllib.request.Request(args.url, method="HEAD"), timeout=60) as r:
            self.size = int(r.headers["Content-Length"])
        self.pos = 0

    def seekable(self):
        return True

    def readable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=0):
        self.pos = {0: offset, 1: self.pos + offset, 2: self.size + offset}[whence]
        return self.pos

    def read(self, n=-1):
        if n is None or n < 0:
            n = self.size - self.pos
        n = min(n, self.size - self.pos)
        if n <= 0:
            return b""
        data = get(self.pos, self.pos + n - 1)
        self.pos += n
        return data

    def readinto(self, b):
        data = self.read(len(b))
        b[: len(data)] = data
        return len(data)


class StorageRef:
    def __init__(self, key, dtype, numel):
        self.key, self.dtype, self.numel = key, dtype, numel


class TensorRef:
    def __init__(self, storage, offset, size, stride):
        self.storage, self.offset, self.size, self.stride = storage, offset, tuple(size), tuple(stride)


def rebuild_tensor(storage, storage_offset, size, stride, *_rest):
    return TensorRef(storage, storage_offset, size, stride)


def rebuild_parameter(data, *_rest):
    return data


STORAGE_TYPES = {name for name in dir(torch) if name.endswith("Storage")}


class LayoutUnpickler(pickle.Unpickler):
    """Reads data.pkl without loading tensors, and refuses anything else."""

    def find_class(self, module, name):
        if (module, name) == ("collections", "OrderedDict"):
            return collections.OrderedDict
        if (module, name) == ("torch._utils", "_rebuild_tensor_v2"):
            return rebuild_tensor
        if (module, name) == ("torch._utils", "_rebuild_parameter"):
            return rebuild_parameter
        if module == "torch" and name in STORAGE_TYPES:
            return getattr(torch, name)
        raise pickle.UnpicklingError(f"refusing to load {module}.{name}")

    def persistent_load(self, pid):
        _, storage_type, key, _location, numel = pid
        return StorageRef(str(key), storage_type.dtype, int(numel))


remote = RemoteFile()
print(f"remote checkpoint: {remote.size / 1e9:.2f} GB")
zf = zipfile.ZipFile(remote)
pkl_name = next(n for n in zf.namelist() if n.endswith("/data.pkl"))
prefix = pkl_name[: -len("data.pkl")]
layout = LayoutUnpickler(io.BytesIO(zf.read(pkl_name))).load()


def storages_in(obj):
    if isinstance(obj, TensorRef):
        yield obj.storage
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from storages_in(v)
    elif isinstance(obj, (list, tuple)):
        for v in obj:
            yield from storages_in(v)


def entry_size(key):
    return zf.getinfo(f"{prefix}data/{key}").file_size


for top, value in layout.items():
    keys = {s.key for s in storages_in(value)}
    print(f"  {top}: {len(keys)} storages, {sum(entry_size(k) for k in keys) / 1e9:.2f} GB")
if args.list:
    sys.exit(0)

state = layout[args.key]
needed = {}
for s in storages_in(state):
    needed[s.key] = s
total = sum(entry_size(k) for k in needed)
print(f"downloading {len(needed)} storages of {args.key}: {total / 1e9:.2f} GB")

# Keep finished storages on disk so an interrupted run resumes where it stopped.
# The connection here is throttled per stream, so storages download in
# parallel, each in chunks.
cache = args.out + ".parts"
os.makedirs(cache, exist_ok=True)
CHUNK = 4 << 20
WORKERS = 6
lock = threading.Lock()
progress = {"done": 0, "fetched": 0}
started = time.time()


def fetch_storage(key):
    info = zf.getinfo(f"{prefix}data/{key}")
    part = os.path.join(cache, key)
    if not (os.path.exists(part) and os.path.getsize(part) == info.file_size):
        if info.compress_type != zipfile.ZIP_STORED:
            raise RuntimeError(f"storage {key} is compressed; expected stored entries")
        local = get(info.header_offset, info.header_offset + 29)
        name_len = int.from_bytes(local[26:28], "little")
        extra_len = int.from_bytes(local[28:30], "little")
        start = info.header_offset + 30 + name_len + extra_len
        with open(part + ".tmp", "wb") as f:
            for off in range(0, info.file_size, CHUNK):
                data = get(start + off, start + min(off + CHUNK, info.file_size) - 1)
                f.write(data)
                with lock:
                    progress["fetched"] += len(data)
        os.replace(part + ".tmp", part)
    with lock:
        progress["done"] += info.file_size
        rate = progress["fetched"] / max(1e-6, time.time() - started)
        print(f"  {progress['done'] / 1e9:.2f}/{total / 1e9:.2f} GB  ({rate / 1e6:.2f} MB/s)", flush=True)


# Biggest first, so the long downloads overlap.
order = sorted(needed, key=entry_size, reverse=True)
with concurrent.futures.ThreadPoolExecutor(WORKERS) as pool:
    for future in concurrent.futures.as_completed([pool.submit(fetch_storage, k) for k in order]):
        future.result()

storages = {}
for key, ref in needed.items():
    with open(os.path.join(cache, key), "rb") as f:
        storages[key] = torch.frombuffer(bytearray(f.read()), dtype=ref.dtype)


def build(obj):
    if isinstance(obj, TensorRef):
        flat = storages[obj.storage.key]
        return torch.as_strided(flat, obj.size, obj.stride, obj.offset).clone()
    if isinstance(obj, dict):
        return collections.OrderedDict((k, build(v)) for k, v in obj.items())
    return obj


torch.save({args.key: build(state)}, args.out)
print(f"saved {args.out} ({os.path.getsize(args.out) / 1e9:.2f} GB)")
