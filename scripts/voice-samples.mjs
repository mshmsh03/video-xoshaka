// Writes a short sample of each candidate narrator to out/voice-samples/ so the
// person can pick by ear (never pick a voice for them from their name).
// Run with: node scripts/voice-samples.mjs ["a line from their story"]

import { mkdirSync } from "node:fs";
import { KokoroTTS } from "kokoro-js";

const VOICES = ["am_michael", "am_fenrir", "bm_george", "af_heart", "bf_emma"];
const TEXT =
  process.argv[2] ??
  "A few months ago, I had no idea what I was doing. Then a friend told me one thing, and everything changed.";

mkdirSync("out/voice-samples", { recursive: true });
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  dtype: "fp32",
  device: "cpu",
});

for (const voice of VOICES) {
  const audio = await tts.generate(TEXT, { voice });
  await audio.save(`out/voice-samples/${voice}.wav`);
  console.log(`${voice}: ${(audio.audio.length / audio.sampling_rate).toFixed(2)}s`);
}
