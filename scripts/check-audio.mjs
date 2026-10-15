// Measures a rendered video's sound: narration vs music balance, clipping, and
// optional spot checks. Uses the ffmpeg bundled with Remotion.
// Run from the Remotion project root:
//
//   node check-audio.mjs out/video.mp4 [--voice src/story/voice.json]
//     [--at 1.2-1.9] [--at 19.6-20.2] ...
//
// "speech" is every narrated line (with the music ducked under it), "between"
// the gaps where only music and effects play. Aim for speech around -20 dBFS
// and the music bed 8-12 dB under it; peaks under 0.99.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// npx is a .cmd on Windows, which Node only runs through a shell: pass one
// quoted command string there instead of an argument list.
const npx = (args, options) =>
  process.platform === "win32"
    ? execSync(`npx ${args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)).join(" ")}`, options)
    : execFileSync("npx", args, options);

const video = process.argv[2];
if (!video) throw new Error("Usage: check-audio.mjs <video.mp4> [--voice voice.json] [--at a-b]");
const flagValues = (name) =>
  process.argv.flatMap((a, i) => (a === `--${name}` ? [process.argv[i + 1]] : []));
const voicePath = flagValues("voice")[0] ?? "src/story/voice.json";

const wav = join(tmpdir(), `check-audio-${process.pid}.wav`);
npx(
  ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", video, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav],
  { stdio: "inherit" },
);
const buf = readFileSync(wav);
rmSync(wav);
const SR = 16000;
const n = (buf.length - 44) / 2;
const sample = (i) => buf.readInt16LE(44 + i * 2) / 32768;

const level = (ranges) => {
  let sum = 0;
  let count = 0;
  for (const [a, z] of ranges) {
    for (let i = Math.floor(a * SR); i < Math.min(n, z * SR); i++) {
      sum += sample(i) ** 2;
      count++;
    }
  }
  return count ? `${(10 * Math.log10(sum / count)).toFixed(1)} dBFS` : "n/a";
};

let peak = 0;
let clipped = 0;
for (let i = 0; i < n; i++) {
  const v = Math.abs(sample(i));
  peak = Math.max(peak, v);
  if (v > 0.99) clipped++;
}
console.log(`length ${(n / SR).toFixed(1)}s, peak ${peak.toFixed(3)}, clipped samples ${clipped}`);

try {
  const voice = JSON.parse(readFileSync(voicePath, "utf8"));
  const speech = voice.scenes.map((s) => {
    const from = s.startSeconds + s.voiceFrom / voice.fps;
    return [from + 0.2, from + s.voiceSeconds - 0.2];
  });
  const between = [];
  for (let i = 0; i < speech.length - 1; i++) {
    const a = speech[i][1] + 0.45;
    const z = speech[i + 1][0] - 0.45;
    if (z - a > 0.3) between.push([a, z]);
  }
  console.log(`speech ${level(speech)}, between lines ${level(between)}`);
} catch {
  console.log(`(no ${voicePath}; skipped the speech/music split)`);
}

for (const spec of flagValues("at")) {
  const [a, z] = spec.split("-").map(Number);
  console.log(`${a}s-${z}s: ${level([[a, z]])}`);
}
