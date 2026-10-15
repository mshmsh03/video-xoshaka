// Searches HeyGen's background-music catalog and downloads picks.
// Needs the heygen CLI signed in (see references/music.md). On Windows the CLI
// lives in WSL, so this calls it through `wsl`.
//
//   node heygen-music.mjs search "playful quirky comedy, pizzicato" [--limit 8]
//   node heygen-music.mjs download <id> [<id> ...] [--out public/bgm/options]
//
// `search` prints one line per track: id, seconds, score, description. Ids can
// be shortened to their first 8 characters for `download`.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CACHE = join(tmpdir(), "heygen-music-last-search.json");

const heygen = (args) => {
  if (process.platform === "win32") {
    const quoted = args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
    return execFileSync("wsl", ["-e", "bash", "-lc", `~/.local/bin/heygen ${quoted}`], {
      encoding: "utf8",
    });
  }
  return execFileSync("heygen", args, { encoding: "utf8" });
};

const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const [command, ...rest] = process.argv.slice(2);

if (command === "search") {
  const query = rest.find((a) => !a.startsWith("--"));
  if (!query) throw new Error('Usage: heygen-music.mjs search "<mood description>"');
  const raw = heygen([
    "audio", "sounds", "list",
    "--query", query,
    "--limit", flag("limit", "8"),
    "--min-score", flag("min-score", "0.5"),
  ]);
  const json = JSON.parse(raw.slice(raw.indexOf("{")));
  if (json.error) {
    throw new Error(`${json.error.message}. Is the heygen CLI signed in? See references/music.md.`);
  }
  // Keep every search's tracks so `download` can find ids from any of them.
  let known = {};
  try {
    known = JSON.parse(readFileSync(CACHE, "utf8"));
  } catch {}
  for (const track of json.data) {
    known[track.id] = track;
    console.log(
      `${track.id.slice(0, 8)}  ${String(track.duration).padStart(4)}s  ${track.score.toFixed(2)}  ${track.description}`,
    );
  }
  writeFileSync(CACHE, JSON.stringify(known));
} else if (command === "download") {
  const out = flag("out", "public/bgm/options");
  const ids = rest.filter((a, i) => !a.startsWith("--") && rest[i - 1] !== "--out");
  const known = JSON.parse(readFileSync(CACHE, "utf8"));
  mkdirSync(out, { recursive: true });
  for (const id of ids) {
    const track = Object.values(known).find((t) => t.id.startsWith(id));
    if (!track) throw new Error(`No track ${id} in the last searches. Run search first.`);
    const slug = track.description.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const file = join(out, `${track.id.slice(0, 8)}-${slug}.mp3`);
    const response = await fetch(track.audio_url);
    if (!response.ok) throw new Error(`Download failed for ${id}: ${response.status}`);
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    console.log(`${file}  (${track.duration}s)`);
  }
} else {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 10).join("\n"));
}
