// Renders single frames to PNG for a visual check, by bundling once and then
// calling `remotion still` per frame. (Rendering an image sequence with
// `remotion render --frames` fails with "EINVAL ... write" once the
// composition has inline audio, so don't use that for checks.)
// Run from the Remotion project root:
//
//   node stills.mjs <CompositionId> <spec> [<spec> ...] [--voice src/story/voice.json]
//
// A spec is a frame number (412), a scene's end ("end:pos" = just before its
// transition), or a word in a scene's narration plus seconds
// ("pressure@websites+0.4" = 0.4 s after the narrator says "pressure").
// Frames land in out/stills/.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";

// npx is a .cmd on Windows, which Node only runs through a shell: pass one
// quoted command string there instead of an argument list.
const npx = (args, options) =>
  process.platform === "win32"
    ? execSync(`npx ${args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)).join(" ")}`, options)
    : execFileSync("npx", args, options);

const [composition, ...rest] = process.argv.slice(2);
const flagIndex = rest.indexOf("--voice");
const voicePath = flagIndex >= 0 ? rest[flagIndex + 1] : "src/story/voice.json";
const specs = rest.filter((_, i) => flagIndex < 0 || (i !== flagIndex && i !== flagIndex + 1));
if (!composition || specs.length === 0) {
  throw new Error("Usage: stills.mjs <CompositionId> <frame|end:scene|word@scene+sec> ...");
}

let voice = null;
try {
  voice = JSON.parse(readFileSync(voicePath, "utf8"));
} catch {}
const scene = (id) => {
  const s = voice?.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`No scene "${id}" in ${voicePath}`);
  return s;
};

const toFrame = (spec) => {
  if (/^\d+$/.test(spec)) return Number(spec);
  if (spec.startsWith("end:")) {
    const s = scene(spec.slice(4));
    return Math.round(s.startSeconds * voice.fps + s.durationInFrames - voice.transitionFrames - 3);
  }
  const m = spec.match(/^(.+)@([^+-]+)([+-][\d.]+)?$/);
  if (!m) throw new Error(`Can't read "${spec}"`);
  const s = scene(m[2]);
  const word = s.captions.find((c) => c.text.trim().toLowerCase().startsWith(m[1].toLowerCase()));
  if (!word) throw new Error(`"${m[1]}" is not in the narration of ${m[2]}`);
  const seconds = s.startSeconds + s.voiceFrom / voice.fps + word.startMs / 1000 + Number(m[3] ?? 0);
  return Math.round(seconds * voice.fps);
};

const run = (args) => npx(["remotion", ...args], { stdio: ["ignore", "ignore", "inherit"] });

rmSync("out/stills-bundle", { recursive: true, force: true });
run(["bundle", "--out-dir=out/stills-bundle"]);
for (const spec of specs) {
  const frame = toFrame(spec);
  const file = `out/stills/${spec.replace(/[^a-z0-9]+/gi, "_")}-f${frame}.png`;
  run(["still", "out/stills-bundle", composition, file, `--frame=${frame}`]);
  console.log(file);
}
