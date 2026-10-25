"""Narrate every scene of story.json in Sorani and write one FLAC per scene.

scripts/make-voice.mjs then trims, normalizes and times the words, the same
way it does for Kokoro. Two engines:
- f5  : F5-TTS Central Kurdish (aranemini/central-kurdish-tts), the real
        voice. Text goes through AsoSoft's normalizer and G2P first.
- mms : razhan/mms-tts-ckb, a quick stand-in for building and timing.

Copy this file and fetch_ema.py into the video project's tts/ folder, with
the model files in tts/f5-repo/ (toolbox.md, "Sorani voices"), and run it from
the project root with the tts venv:
  tts/.venv/Scripts/python -I tts/speak_story.py [--engine mms] [--only hook,cta]
"""
import argparse
import json
import re
import sys
from pathlib import Path

# F5 prints the G2P text (ř, ł, ʔ...); a Windows console defaults to cp1252.
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
TTS = ROOT / "tts"
F5 = TTS / "f5-repo"
VOICES = {
    "studio-male": ("studio-male-ema.pt", "prompt-studio-male"),
    "audiobook-male": ("audiobook-male-ema.pt", "prompt-audiobook-male"),
    "audiobook-female": ("audiobook-female-ema.pt", "prompt-audiobook-female"),
}

parser = argparse.ArgumentParser()
parser.add_argument("--engine", choices=["f5", "mms"], default="f5")
parser.add_argument("--story", default=str(ROOT / "src/story/story.json"))
parser.add_argument("--out", default=str(ROOT / "out/voice-raw"))
parser.add_argument("--only", default="", help="comma-separated scene ids")
parser.add_argument("--nfe", type=int, default=32, help="F5 sampling steps")
args = parser.parse_args()

story = json.loads(Path(args.story).read_text(encoding="utf-8"))
scenes = [s for s in story["scenes"] if not args.only or s["id"] in args.only.split(",")]
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)


def speak_mms():
    import torch
    from transformers import AutoTokenizer, VitsModel

    tokenizer = AutoTokenizer.from_pretrained("razhan/mms-tts-ckb")
    model = VitsModel.from_pretrained("razhan/mms-tts-ckb")
    model.speaking_rate = story.get("speed", 1.0)
    rate = model.config.sampling_rate
    # The model only knows Arabic kaf and plain heh.
    table = str.maketrans({"ک": "ك", "ھ": "ه", "ي": "ی", "ى": "ی", "‌": "", "‍": ""})
    for scene in scenes:
        text = scene.get("say", scene["text"]).translate(table)
        parts = []
        for clause in re.split(r"([.،؟?!:؛,])", text):
            if not clause.strip():
                continue
            if re.fullmatch(r"[.،؟?!:؛,]", clause):
                # A longer stop after a sentence than after a comma.
                pause = 0.42 if clause in ".؟?!" else 0.22
                parts.append(np.zeros(int(pause * rate), dtype=np.float32))
                continue
            torch.manual_seed(0)
            with torch.no_grad():
                wav = model(**tokenizer(clause.strip(), return_tensors="pt")).waveform[0].numpy()
            parts.append(wav)
        sf.write(out / f"{scene['id']}.flac", np.concatenate(parts), rate)
        print(f"{scene['id']}: mms done", flush=True)


def speak_f5():
    import asosoft
    from omegaconf import OmegaConf
    from hydra.utils import get_class
    from f5_tts.infer.utils_infer import (
        infer_process, load_model, load_vocoder, preprocess_ref_audio_text,
        cfg_strength, cross_fade_duration, device, sway_sampling_coef, target_rms,
    )

    import torch
    import torchaudio

    # torchaudio.load goes through torchcodec, whose DLL doesn't load on this
    # Windows setup; F5 only uses it to read WAVs, which soundfile does fine.
    def load_wav(path, *_args, **_kwargs):
        data, rate = sf.read(str(path), dtype="float32", always_2d=True)
        return torch.from_numpy(data.T.copy()), rate

    torchaudio.load = load_wav

    voice = story["voice"].split(":", 1)[1]
    ckpt, prompt = VOICES[voice]

    def g2p(text):
        # As in the model's own infer.py.
        text = re.sub(r"(\d{1,8})\s*[-–]\s*(\d{1,8})", r"\1 تا \2", text)
        norm = asosoft.Normalize(text, changeInitialR=True, deepUnicodeCorrectios=True,
                                 additionalUnicodeCorrections=True)
        norm = asosoft.NormalizePunctuations(norm, seprateAllPunctuations=True)
        try:
            norm = asosoft.Number2Word(norm)
        except Exception as e:  # noqa: BLE001 - the model's script skips this too
            print(f"[Number2Word] skipped: {e}")
        result = asosoft.KurdishG2P(norm).replace("ˈ", "")
        for old, new in {"ẍ": "χ", "ƹ": "¿", "ḧ": "ḥ"}.items():
            result = result.replace(old, new)
        return result

    cfg = OmegaConf.load(F5 / "F5TTS_v1_Base.yaml")
    model = load_model(get_class(f"f5_tts.model.{cfg.model.backbone}"), cfg.model.arch,
                       str(F5 / ckpt), mel_spec_type="vocos", vocab_file=str(F5 / "vocab.txt"),
                       device=device)
    vocoder = load_vocoder(vocoder_name="vocos", is_local=False, device=device)
    prompt_text = g2p((F5 / f"{prompt}.txt").read_text(encoding="utf-8").strip())
    ref_audio, ref_text = preprocess_ref_audio_text(str(F5 / f"{prompt}.wav"), prompt_text)
    print(f"F5 on {device}, voice {voice}, {args.nfe} steps", flush=True)

    for scene in scenes:
        text = g2p(scene.get("say", scene["text"]))
        print(f"{scene['id']}: {text}", flush=True)
        audio, rate, _ = infer_process(
            ref_audio, ref_text, text, model, vocoder, mel_spec_type="vocos",
            target_rms=target_rms, cross_fade_duration=cross_fade_duration, nfe_step=args.nfe,
            cfg_strength=cfg_strength, sway_sampling_coef=sway_sampling_coef,
            speed=story.get("speed", 1.0), device=device,
        )
        sf.write(out / f"{scene['id']}.flac", audio, rate)
        print(f"{scene['id']}: {len(audio) / rate:.2f}s", flush=True)


speak_f5() if args.engine == "f5" else speak_mms()
