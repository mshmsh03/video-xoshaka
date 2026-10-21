// Writes a short sample of each candidate narrator to out/voice-samples/ so the
// person can pick by ear (never pick a voice for them from their name).
// Run with: node scripts/voice-samples.mjs ["a line from their story"]
//   [--voices ar-IQ-RanaNeural,ar-IQ-BasselNeural]
// Without --voices it samples five local Kokoro voices. Edge voices such as
// ar-IQ-RanaNeural are online and need Python with edge-tts (see make-voice.mjs).

import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = args.indexOf("--voices");
const VOICES =
  flag >= 0
    ? args[flag + 1].split(",")
    : ["am_michael", "am_fenrir", "bm_george", "af_heart", "bf_emma"];
const TEXT =
  args.find((a, i) => !a.startsWith("--") && (flag < 0 || i !== flag + 1)) ??
  "A few months ago, I had no idea what I was doing. Then a friend told me one thing, and everything changed.";

// Edge voice names look like "ar-IQ-RanaNeural"; Kokoro's like "bm_george".
const isEdge = (voice) => /^[a-z]{2,3}-.+Neural$/.test(voice);
const PYTHON = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const EDGE_SCRIPT = fileURLToPath(new URL("edge-voice.py", import.meta.url));

mkdirSync("out/voice-samples", { recursive: true });
let tts;
for (const voice of VOICES) {
  if (isEdge(voice)) {
    const words = JSON.parse(
      execFileSync(PYTHON, [EDGE_SCRIPT], {
        input: JSON.stringify({ text: TEXT, voice, out: `out/voice-samples/${voice}.mp3` }),
        stdio: ["pipe", "pipe", "inherit"],
      }),
    );
    console.log(`${voice}: ${(words.at(-1)?.end ?? 0).toFixed(2)}s`);
    continue;
  }
  if (!tts) {
    const { KokoroTTS } = await import("kokoro-js");
    tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: "fp32",
      device: "cpu",
    });
  }
  const audio = await tts.generate(TEXT, { voice });
  await audio.save(`out/voice-samples/${voice}.wav`);
  console.log(`${voice}: ${(audio.audio.length / audio.sampling_rate).toFixed(2)}s`);
}
