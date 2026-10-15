import { Audio, Video } from "@remotion/media";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, headingFont, monoFont } from "../../theme";
import { fadeUp, popIn } from "../motion";
import { Narration } from "../Narration";
import { findMedia } from "../PhotoCard";
import { voiceEnd, type SceneId } from "../voice";

type FreezeSceneProps = {
  readonly id: SceneId;
  // public/photos/<clip>.mp4 (or .mov/.webm) of the hero.
  readonly clip: string;
  // Seconds into the clip where it freezes. Give the scene a "lead" in
  // story.json about 0.6 s longer, so the voice starts after the scratch.
  readonly freezeAt: number;
  readonly sticker: string;
  // Where the arrow tip should point (the face), in video pixels.
  readonly pointAt: { readonly x: number; readonly y: number };
  readonly kicker: string;
  readonly title: React.ReactNode;
  // Caption word ranges the sticker already shows, e.g. [[0, 2]] for "Yep. That's me."
  readonly hideWords?: readonly (readonly [number, number])[];
};

// The "Yep, that's me. You're probably wondering how I got here." opener:
// the clip plays, freezes with a record scratch and a flash, desaturates, a
// sticker points at the hero, then the title lands after the line.
export const FreezeScene: React.FC<FreezeSceneProps> = ({
  id,
  clip,
  freezeAt,
  sticker,
  pointAt,
  kicker,
  title,
  hideWords,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const freezeFrame = Math.round(freezeAt * fps);
  const frozen = frame >= freezeFrame;
  const media = findMedia(clip);
  const titleAt = (voiceEnd(id) + 0.8) * fps;
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  // The sticker sits up and to the left of the face; the arrow curves down to it.
  const stickerLeft = 90;
  const stickerTop = Math.max(300, pointAt.y - 360);
  const tip = { x: pointAt.x - stickerLeft - 60, y: pointAt.y - stickerTop - 40 };

  return (
    <>
      <AbsoluteFill
        style={{
          filter: frozen ? "saturate(0.35) sepia(0.25) contrast(1.1)" : undefined,
          scale: interpolate(frame, [freezeFrame, freezeFrame + 0.6 * fps], [1, 1.08], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {media ? (
          <Freeze frame={freezeFrame} active={frozen}>
            <Video name="Hero clip" src={media.src} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
          </Freeze>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(transparent 50%, rgba(20, 20, 19, 0.94) 78%)" }} />
      <AbsoluteFill
        style={{
          backgroundColor: "white",
          opacity: interpolate(frame, [freezeFrame, freezeFrame + 5], [0.75, 0], clamp),
        }}
      />
      <Interactive.Div
        name="Sticker"
        style={{ position: "absolute", left: stickerLeft, top: stickerTop, ...popIn(frame, freezeFrame + 3, fps) }}
      >
        <div
          style={{
            padding: "16px 30px",
            borderRadius: 10,
            backgroundColor: colors.accent,
            color: colors.background,
            fontFamily: headingFont,
            fontSize: 64,
            fontWeight: 700,
            rotate: "-5deg",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
          }}
        >
          {sticker}
        </div>
        <svg width={10} height={10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path
            d={`M 320 110 C 420 130, ${tip.x - 40} ${tip.y - 120}, ${tip.x} ${tip.y}`}
            fill="none"
            stroke={colors.accent}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={900}
            strokeDashoffset={interpolate(frame, [freezeFrame + 6, freezeFrame + 16], [900, 0], clamp)}
          />
        </svg>
      </Interactive.Div>
      <Interactive.Div
        name="Title"
        style={{ position: "absolute", left: 100, right: 100, top: 1360, ...fadeUp(frame, titleAt, fps, 50) }}
      >
        <div style={{ fontFamily: monoFont, fontSize: 40, color: colors.accent }}>{kicker}</div>
        <div style={{ fontFamily: headingFont, fontSize: 120, fontWeight: 700, lineHeight: 1, color: colors.text }}>
          {title}
        </div>
      </Interactive.Div>
      <Audio
        name="Record scratch"
        from={freezeFrame - 4}
        src={staticFile("sfx/record-scratch.wav")}
        volume={0.6}
        premountFor={fps}
      />
      <Narration id={id} hideWords={hideWords} />
    </>
  );
};
