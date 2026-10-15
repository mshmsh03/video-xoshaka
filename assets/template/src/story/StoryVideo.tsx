import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  getStaticFiles,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";
import { BeatScene } from "./scenes/BeatScene";
import { FreezeScene } from "./scenes/FreezeScene";
import { sceneVoice, STORY_VOICE, wordAt } from "./voice";

// Scene lengths come from the narration (voice.json). After editing
// story.json, run scripts/make-voice.mjs again.
const length = (id: string) => sceneVoice(id).durationInFrames;
const startOf = (id: string) => sceneVoice(id).startSeconds;

// Background music, saved as public/bgm/track.* (see references/music.md).
// MUSIC_GAIN: aim for about -24 dBFS between lines, i.e.
// 10 ** ((-24 - trackRmsDb) / 20). DUCK: how far it dips under the narrator.
const MUSIC = getStaticFiles().find((file) => /^bgm\/track\.(mp3|wav|m4a)$/i.test(file.name));
const MUSIC_GAIN = 0.5;
const DUCK = 0.6;
const FREEZE_AT = 1.3;

const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export const StoryVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: STORY_VOICE.transitionFrames })} />;
  const slideIn = <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: STORY_VOICE.transitionFrames })} />;

  // Music: a few seconds under the hero clip until the record scratch stops it,
  // then from chapter 1 on, dipping under every line and cutting out for the
  // big reaction gags (comedic silence).
  const scratch = Math.round(FREEZE_AT * fps) - 4;
  const musicStart = Math.round(startOf("beginning") * fps);
  const silences = [Math.round((startOf("beginning") + wordAt("beginning", "nothing") + 0.3) * fps)];
  const talking = Math.max(
    0,
    ...STORY_VOICE.scenes.map((s) => {
      const from = s.startSeconds * fps + s.voiceFrom;
      const to = from + s.voiceSeconds * fps;
      return Math.min(smoothstep((frame - from + 6) / 6), smoothstep((to - frame + 10) / 10));
    }),
  );
  const silence = Math.min(
    ...silences.map((at) =>
      interpolate(frame, [at - 2, at, at + 1.3 * fps, at + 1.8 * fps], [1, 0, 0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );
  const ending = interpolate(frame, [durationInFrames - 3 * fps, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const musicVolume = MUSIC_GAIN * (1 - DUCK * talking) * silence * ending;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Freeze" durationInFrames={length("freeze")} premountFor={fps}>
          <FreezeScene
            id="freeze"
            clip="me"
            freezeAt={FREEZE_AT}
            sticker="Yep. That's me."
            pointAt={{ x: 700, y: 700 }}
            kicker="A true story"
            title={<>My life with <span style={{ color: colors.accent }}>Claude</span></>}
            hideWords={[[0, 2]]}
          />
        </TransitionSeries.Sequence>
        {fadeIn}
        <TransitionSeries.Sequence name="Beginning" durationInFrames={length("beginning")} premountFor={fps}>
          <BeatScene id="beginning" chapter="Chapter 1 · The beginning" />
        </TransitionSeries.Sequence>
        {slideIn}
        <TransitionSeries.Sequence name="End" durationInFrames={length("end")} premountFor={fps}>
          <BeatScene id="end" showCaptions={false} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {MUSIC ? (
        <>
          <Audio name="Music intro" src={MUSIC.src} durationInFrames={scratch} volume={MUSIC_GAIN} />
          <Audio name="Music" src={MUSIC.src} from={musicStart} volume={musicVolume} premountFor={fps} />
        </>
      ) : null}
      <Audio
        name="Whoosh into end"
        from={Math.round(startOf("end") * fps)}
        src={staticFile("sfx/whoosh.wav")}
        volume={0.35}
        premountFor={fps}
      />
    </AbsoluteFill>
  );
};
