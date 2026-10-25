// Narrates a story.json. Writes one WAV per scene and a voice.json with each
// scene's length in frames and word timings for the captions. The voice name
// picks the engine:
// - Kokoro ("bm_george"): local and free, offline after the first ~330 MB
//   model download. Needs `npm i -D kokoro-js`.
// - Microsoft Edge ("ar-IQ-RanaNeural"): free and online, many languages
//   including Arabic, with measured word timings. Needs Python with
//   `python -m pip install edge-tts` (scripts/edge-voice.py), and ffmpeg or the
//   copy bundled with Remotion.
// - Sorani Kurdish ("f5:studio-male"): spoken beforehand by tts/speak_story.py
//   (F5-TTS Central Kurdish, offline, slow on a CPU); this script reads its
//   files. See toolbox.md, "Sorani voices".
//
// Run from the Remotion project root:
//   node scripts/make-voice.mjs [--story src/story/story.json]
//     [--out src/story/voice.json] [--audio public/voice] [--raw out/voice-raw]

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const STORY = arg("story", "src/story/story.json");
const OUT = arg("out", "src/story/voice.json");
const AUDIO_DIR = arg("audio", "public/voice");
// Where tts/speak_story.py left the Sorani recordings (f5:/mms: voices).
const RAW_DIR = arg("raw", "out/voice-raw");
// voice.json refers to the WAVs relative to public/.
const AUDIO_SRC = AUDIO_DIR.replace(/^public\//, "");

const story = JSON.parse(readFileSync(STORY, "utf8"));
const { fps, transitionFrames, leadIn, tail } = story;
// Edge voice names look like "ar-IQ-RanaNeural"; Kokoro's like "bm_george".
const EDGE = /^[a-z]{2,3}-.+Neural$/.test(story.voice);
// Sorani voices ("f5:studio-male") are spoken beforehand by tts/speak_story.py
// (from the skill's scripts/sorani/) into out/voice-raw/<id>.flac; this script
// trims, normalizes and times them like Kokoro's.
const RAW = /^(f5|mms):/.test(story.voice);

// Where the speech starts and ends, keeping a little air around it.
const speechRange = (samples, sr) => {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const threshold = peak * 0.02;
  let first = 0;
  while (first < samples.length && Math.abs(samples[first]) < threshold) first++;
  let last = samples.length - 1;
  while (last > first && Math.abs(samples[last]) < threshold) last--;
  return [
    Math.max(0, first - Math.round(0.03 * sr)),
    Math.min(samples.length, last + Math.round(0.08 * sr)),
  ];
};

// Cut the model's leading and trailing silence, keeping a little air.
const trim = (samples, sr) => samples.slice(...speechRange(samples, sr));

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
// The same for each written word when `say` spells it differently ("٢٠ی" read
// as "بیستی", "PHP" as "پی ئێچ پی"): the words both share line up, and each
// run that differs takes the letters of what was actually said.
const spokenLengths = (words, said) => {
  const letters = (w) => spokenLength(w.replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x660));
  const n = words.length;
  const m = said.length;
  const common = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      common[i][j] =
        words[i] === said[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }
  const lengths = words.map(letters);
  let i = 0;
  let j = 0;
  let runI = 0;
  let runJ = 0;
  const flush = () => {
    if (i === runI) return;
    const heard = said.slice(runJ, j).reduce((a, w) => a + letters(w), 0);
    const own = words.slice(runI, i).map((w) => letters(w) || 1);
    const ownTotal = own.reduce((a, b) => a + b, 0);
    own.forEach((l, k) => (lengths[runI + k] = (heard * l) / ownTotal));
  };
  while (i < n && j < m) {
    if (words[i] === said[j]) {
      flush();
      i++;
      j++;
      runI = i;
      runJ = j;
    } else if (common[i + 1][j] >= common[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  i = n;
  j = m;
  flush();
  return lengths;
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
const timeWords = (text, pauses, duration, spoken = text) => {
  const words = text.split(/\s+/);
  const lengths = spokenLengths(words, spoken.split(/\s+/));
  const isBreak = (word, i) =>
    i < words.length - 1 && /[.,:;?!،؛؟]$/.test(word) && !ABBREVIATION.test(word);

  // Where each break would fall if speech ran at an even pace, with extra time
  // for the stop itself.
  const weights = words.map((w, i) => lengths[i] + 1 + (isBreak(w, i) ? 3 : 0));
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
    const weights = slice.map((_, k) => lengths[from + k] + 1);
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

// npx is a .cmd on Windows, which Node only runs through a shell: pass one
// quoted command string there instead of an argument list.
const npx = (args, options) =>
  process.platform === "win32"
    ? execSync(`npx ${args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)).join(" ")}`, options)
    : execFileSync("npx", args, options);

// Decodes an audio file to mono samples with ffmpeg, or with the copy bundled
// with Remotion when ffmpeg isn't on the PATH. That copy can't write raw
// samples, so both go through a 16-bit WAV next to the file.
const decode = (file, sr) => {
  const wav = file.replace(/\.\w+$/, ".wav");
  const args = ["-v", "error", "-y", "-i", file, "-ac", "1", "-ar", String(sr), "-c:a", "pcm_s16le", wav];
  try {
    execFileSync("ffmpeg", args);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    npx(["remotion", "ffmpeg", ...args]);
  }
  const buf = readFileSync(wav);
  let pos = 12;
  while (buf.toString("ascii", pos, pos + 4) !== "data") {
    const size = buf.readUInt32LE(pos + 4);
    pos += 8 + size + (size % 2);
  }
  const samples = new Float32Array(buf.readUInt32LE(pos + 4) / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(pos + 8 + i * 2) / 32768;
  return samples;
};

const PYTHON = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const EDGE_SCRIPT = fileURLToPath(new URL("edge-voice.py", import.meta.url));

// Speaks a line through scripts/edge-voice.py and returns when each word is
// said, in seconds. A speed of 1.1 becomes Edge's rate "+10%".
const edgeSpeak = (text, voice, speed, out) => {
  const percent = Math.round((speed - 1) * 100);
  const words = execFileSync(PYTHON, [EDGE_SCRIPT], {
    input: JSON.stringify({ text, voice, rate: `${percent >= 0 ? "+" : ""}${percent}%`, out }),
    stdio: ["pipe", "pipe", "inherit"],
  });
  return JSON.parse(words);
};

// Edge reports each word without its punctuation. Finds those words in the
// spoken line and gives their times to the script's own words, so captions keep
// the punctuation that breaks them into phrases. `shift` is the silence trimmed
// off the start. Returns null when `say` and `text` differ in word count.
// Edge starts a word that follows a pause inside the silence, 120 to 160 ms
// before it is heard (measured 2026-10-21), so such a word starts where the
// sound comes back.
const edgeCaptions = (text, spoken, words, shift, pauses) => {
  const shown = text.trim().split(/\s+/);
  const said = spoken.trim().split(/\s+/);
  if (shown.length !== said.length) return null;
  const ranges = [];
  let pos = 0;
  for (const word of said) {
    const at = spoken.indexOf(word, pos);
    ranges.push([at, at + word.length]);
    pos = at + word.length;
  }
  const times = said.map(() => null);
  let from = 0;
  for (const word of words) {
    const at = spoken.indexOf(word.text, from);
    if (at < 0) continue;
    from = at + word.text.length;
    const k = ranges.findIndex(([start, end]) => at >= start && at < end);
    if (k >= 0) times[k] = { start: times[k]?.start ?? word.start, end: word.end };
  }
  // A word Edge didn't report (a lone dash, an emoji) shows as the one before ends.
  let previousEnd = 0;
  const captions = shown.map((word, k) => {
    let start = times[k] ? Math.max(0, times[k].start - shift) : previousEnd;
    const pause = pauses.find((p) => start >= p.start - 0.02 && start < p.end);
    if (times[k] && pause) start = pause.end;
    const end = times[k] ? Math.max(start, times[k].end - shift) : previousEnd;
    previousEnd = end;
    return {
      text: (k === 0 ? "" : " ") + word,
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      timestampMs: Math.round(((start + end) / 2) * 1000),
      confidence: null,
    };
  });
  return { captions, matched: `${times.filter(Boolean).length}/${said.length} words timed by Edge` };
};

let tts;
if (!EDGE && !RAW) {
  const { KokoroTTS } = await import("kokoro-js");
  tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "fp32",
    device: "cpu",
  });
}

mkdirSync(AUDIO_DIR, { recursive: true });
// Edge's own MP3s, kept for reference; the video plays the WAVs.
const EDGE_DIR = "out/voice-edge";
if (EDGE) mkdirSync(EDGE_DIR, { recursive: true });
const scenes = [];
let cursor = 0;
for (const scene of story.scenes) {
  const spoken = scene.say ?? scene.text;
  let sr;
  let samples;
  let edgeTimed = null;
  if (EDGE) {
    sr = 24000;
    const mp3 = `${EDGE_DIR}/${scene.id}.mp3`;
    const words = edgeSpeak(spoken, story.voice, story.speed ?? 1, mp3);
    const decoded = decode(mp3, sr);
    const [start, end] = speechRange(decoded, sr);
    samples = normalize(decoded.slice(start, end));
    edgeTimed = edgeCaptions(scene.text, spoken, words, start / sr, findPauses(samples, sr));
  } else if (RAW) {
    sr = 24000;
    samples = normalize(trim(decode(`${RAW_DIR}/${scene.id}.flac`, sr), sr));
  } else {
    const audio = await tts.generate(spoken, {
      voice: story.voice,
      speed: story.speed,
    });
    sr = audio.sampling_rate;
    samples = normalize(trim(audio.audio, sr));
  }
  writeWav(`${AUDIO_DIR}/${scene.id}.wav`, samples, sr);

  const voiceSeconds = samples.length / sr;
  // Kokoro and the Sorani voices give no word times, so they're estimated from
  // the pauses; so are Edge's when `say` and `text` differ in word count.
  const { captions, matched } =
    edgeTimed ?? timeWords(scene.text, findPauses(samples, sr), voiceSeconds, spoken);
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
