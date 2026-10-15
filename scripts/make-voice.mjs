// Narrates a story.json with the local Kokoro voice model (free, offline after
// the first ~330 MB model download). Writes one WAV per scene and a voice.json
// with each scene's length in frames and word timings for the captions.
//
// Run from the Remotion project root (needs `npm i -D kokoro-js`):
//   node scripts/make-voice.mjs [--story src/story/story.json]
//     [--out src/story/voice.json] [--audio public/voice]

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { KokoroTTS } from "kokoro-js";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const STORY = arg("story", "src/story/story.json");
const OUT = arg("out", "src/story/voice.json");
const AUDIO_DIR = arg("audio", "public/voice");
// voice.json refers to the WAVs relative to public/.
const AUDIO_SRC = AUDIO_DIR.replace(/^public\//, "");

const story = JSON.parse(readFileSync(STORY, "utf8"));
const { fps, transitionFrames, leadIn, tail } = story;

// Cut the model's leading and trailing silence, keeping a little air.
const trim = (samples, sr) => {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const threshold = peak * 0.02;
  let first = 0;
  while (first < samples.length && Math.abs(samples[first]) < threshold) first++;
  let last = samples.length - 1;
  while (last > first && Math.abs(samples[last]) < threshold) last--;
  return samples.slice(
    Math.max(0, first - Math.round(0.03 * sr)),
    Math.min(samples.length, last + Math.round(0.08 * sr)),
  );
};

// Every scene at the same loudness (-20 dBFS RMS), never above -1 dBFS.
const normalize = (samples) => {
  let sum = 0;
  let peak = 0;
  for (const v of samples) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const gain = Math.min(0.1 / Math.sqrt(sum / samples.length), 0.89 / peak);
  return samples.map((v) => v * gain);
};

// Gaps of at least 90 ms inside the speech, in seconds.
const findPauses = (samples, sr) => {
  const win = Math.round(0.01 * sr);
  const levels = [];
  for (let i = 0; i + win <= samples.length; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += samples[j] * samples[j];
    levels.push(Math.sqrt(sum / win));
  }
  const threshold = Math.max(...levels) * 0.05;
  const pauses = [];
  let runStart = -1;
  levels.forEach((level, k) => {
    if (level < threshold) {
      if (runStart < 0) runStart = k;
    } else {
      if (runStart > 0 && k - runStart >= 9) {
        pauses.push({ start: runStart * 0.01, end: k * 0.01, length: (k - runStart) * 0.01 });
      }
      runStart = -1;
    }
  });
  return pauses;
};

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
// Roughly how long a word takes to say: its letters, or for "300" the letters
// of "three hundred".
const spokenLength = (word) => {
  const digits = word.replace(/[^0-9]/g, "");
  if (!digits) return word.replace(/[^\p{L}]/gu, "").length;
  const n = Number(digits);
  const hundreds = Math.floor(n / 100);
  return (hundreds ? ONES[hundreds].length + 7 : 0) + (n % 100 ? 7 : 0) || 4;
};
// Periods that don't end a sentence: titles, times, "e.g." and friends.
const ABBREVIATION = /^(Mr|Mrs|Ms|Dr|St|Jr|vs|etc|e\.g|i\.e|a\.m|p\.m)\.$/i;

// Pairs clause breaks (after , . : ?) with the pauses heard nearest to where
// each break should fall, keeping both in order. Unmatched pauses are hesitations
// inside a clause; unmatched breaks are commas read without a stop.
const alignBreaks = (breaks, pauses) => {
  const SKIP_BREAK = 0.35;
  const SKIP_PAUSE = 0.08;
  const cost = breaks.map(() => pauses.map(() => 0));
  const n = breaks.length;
  const m = pauses.length;
  const dp = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => i * SKIP_BREAK + j * SKIP_PAUSE),
  );
  const step = Array.from({ length: n + 1 }, () => Array(m + 1).fill(""));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i - 1][j - 1] = Math.abs(breaks[i - 1].expected - pauses[j - 1].mid);
      const options = [
        [dp[i - 1][j - 1] + cost[i - 1][j - 1], "match"],
        [dp[i - 1][j] + SKIP_BREAK, "skipBreak"],
        [dp[i][j - 1] + SKIP_PAUSE, "skipPause"],
      ];
      [dp[i][j], step[i][j]] = options.reduce((a, b) => (b[0] < a[0] ? b : a));
    }
  }
  const pairs = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (step[i][j] === "match") {
      pairs.unshift([breaks[i - 1], pauses[j - 1]]);
      i--;
      j--;
    } else if (step[i][j] === "skipBreak") {
      i--;
    } else {
      j--;
    }
  }
  return pairs;
};

// Pins clause breaks to pauses in the audio, then spreads each clause's words
// over its time by how long they take to say.
const timeWords = (text, pauses, duration) => {
  const words = text.split(/\s+/);
  const isBreak = (word, i) =>
    i < words.length - 1 && /[.,:;?!]$/.test(word) && !ABBREVIATION.test(word);

  // Where each break would fall if speech ran at an even pace, with extra time
  // for the stop itself.
  const weights = words.map((w, i) => spokenLength(w) + 1 + (isBreak(w, i) ? 3 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const breaks = [];
  let acc = 0;
  words.forEach((word, i) => {
    acc += weights[i];
    if (isBreak(word, i)) breaks.push({ i, expected: 0.03 + ((duration - 0.11) * acc) / total });
  });

  const pairs = alignBreaks(
    breaks,
    pauses.map((p) => ({ ...p, mid: (p.start + p.end) / 2 })),
  );

  const segments = [];
  let w0 = 0;
  let t0 = 0.03;
  for (const [b, pause] of pairs) {
    segments.push({ w0, w1: b.i, t0, t1: pause.start });
    w0 = b.i + 1;
    t0 = pause.end;
  }
  segments.push({ w0, w1: words.length - 1, t0, t1: duration - 0.08 });
  const m = pairs.length;

  const captions = [];
  for (const { w0: from, w1: to, t0: start, t1: end } of segments) {
    const slice = words.slice(from, to + 1);
    const weights = slice.map((w) => spokenLength(w) + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let t = start;
    slice.forEach((word, k) => {
      const length = ((end - start) * weights[k]) / total;
      captions.push({
        text: (from + k === 0 ? "" : " ") + word,
        startMs: Math.round(t * 1000),
        endMs: Math.round((t + length) * 1000),
        timestampMs: Math.round((t + length / 2) * 1000),
        confidence: null,
      });
      t += length;
    });
  }
  return { captions, matched: `${m}/${breaks.length} breaks` };
};

const writeWav = (path, samples, sr) => {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  });
  writeFileSync(path, buf);
};

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  dtype: "fp32",
  device: "cpu",
});

mkdirSync(AUDIO_DIR, { recursive: true });
const scenes = [];
let cursor = 0;
for (const scene of story.scenes) {
  const audio = await tts.generate(scene.say ?? scene.text, {
    voice: story.voice,
    speed: story.speed,
  });
  const sr = audio.sampling_rate;
  const samples = normalize(trim(audio.audio, sr));
  writeWav(`${AUDIO_DIR}/${scene.id}.wav`, samples, sr);

  const voiceSeconds = samples.length / sr;
  const { captions, matched } = timeWords(scene.text, findPauses(samples, sr), voiceSeconds);
  // A scene can hold the voice back with its own "lead" (seconds).
  const lead = scene.lead ?? leadIn;
  const durationInFrames = Math.ceil((lead + voiceSeconds + tail + scene.hold) * fps);
  scenes.push({
    id: scene.id,
    src: `${AUDIO_SRC}/${scene.id}.wav`,
    durationInFrames,
    voiceFrom: Math.round(lead * fps),
    voiceSeconds: Number(voiceSeconds.toFixed(3)),
    startSeconds: Number((cursor / fps).toFixed(3)),
    captions,
  });
  console.log(`${scene.id}: ${voiceSeconds.toFixed(2)}s voice, ${durationInFrames} frames, ${matched}`);
  cursor += durationInFrames - transitionFrames;
}

const totalFrames = cursor + transitionFrames;
writeFileSync(
  OUT,
  `${JSON.stringify({ fps, transitionFrames, totalFrames, scenes }, null, 2)}\n`,
);
console.log(`total: ${(totalFrames / fps).toFixed(2)}s (${totalFrames} frames)`);
