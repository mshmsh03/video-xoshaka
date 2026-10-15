import voice from "./voice.json";

// Written by scripts/make-voice.mjs from story.json. Run that script before
// opening the Studio or rendering; scene lengths and captions come from here.
export const STORY_VOICE = voice;

export type SceneId = string;

export const sceneVoice = (id: SceneId) => {
  const scene = voice.scenes.find((s) => s.id === id);
  if (!scene) {
    throw new Error(`No narration for scene "${id}". Run scripts/make-voice.mjs.`);
  }
  return scene;
};

// Seconds from the start of the scene until the narrator says the nth word
// starting with `match` (case-insensitive). Time every gag with this, so it
// still lands when the narration is regenerated.
export const wordAt = (id: SceneId, match: string, nth = 0) => {
  const scene = sceneVoice(id);
  const hits = scene.captions.filter((c) =>
    c.text.trim().toLowerCase().startsWith(match.toLowerCase()),
  );
  if (!hits[nth]) {
    throw new Error(`"${match}" (#${nth}) is not in the narration of "${id}".`);
  }
  return scene.voiceFrom / voice.fps + hits[nth].startMs / 1000;
};

// Seconds from the start of the scene until the narrator stops talking.
export const voiceEnd = (id: SceneId) => {
  const scene = sceneVoice(id);
  return scene.voiceFrom / voice.fps + scene.voiceSeconds;
};
