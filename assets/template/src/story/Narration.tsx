import { Audio } from "@remotion/media";
import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, headingFont } from "../theme";
import { sceneVoice, type SceneId } from "./voice";

type Word = { text: string; startMs: number; endMs: number };
type Page = { words: Word[]; startMs: number; endMs: number };

const MAX_CHARS = 26;
// Periods that don't end a phrase (keep in sync with scripts/make-voice.mjs).
const ABBREVIATION = /^(Mr|Mrs|Ms|Dr|St|Jr|vs|etc|e\.g|i\.e|a\.m|p\.m)\.$/i;

// Short caption pages that break at punctuation, so each reads as a phrase.
const toPages = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let current: Word[] = [];
  const flush = () => {
    if (current.length > 0) {
      pages.push({
        words: current,
        startMs: current[0].startMs,
        endMs: current[current.length - 1].endMs,
      });
      current = [];
    }
  };
  for (const word of words) {
    const length = current.map((w) => w.text).join("").length;
    if (current.length > 0 && length + word.text.length > MAX_CHARS) flush();
    current.push(word);
    if (/[.,:;?!]$/.test(word.text) && !ABBREVIATION.test(word.text.trim())) flush();
  }
  flush();
  return pages;
};

type NarrationProps = {
  readonly id: SceneId;
  // Word ranges (first and last index) left out of the captions because the
  // scene shows those words itself.
  readonly hideWords?: readonly (readonly [number, number])[];
  readonly showCaptions?: boolean;
  // Top of the caption block. 1470 suits WhatsApp; for Reels/TikTok use about
  // 1300 so the app's own caption and buttons don't cover it.
  readonly top?: number;
};

// The narrator's line for a scene, with captions that follow the voice.
export const Narration: React.FC<NarrationProps> = ({
  id,
  hideWords,
  showCaptions = true,
  top = 1470,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = sceneVoice(id);
  const ms = ((frame - scene.voiceFrom) / fps) * 1000;
  const pages = toPages(
    scene.captions.filter((_, i) => !hideWords?.some(([from, to]) => i >= from && i <= to)),
  );
  const index = pages.findIndex((page, i) => {
    const next = pages[i + 1];
    return ms >= page.startMs - 80 && ms < (next ? next.startMs - 80 : page.endMs + 700);
  });
  const page = pages[index];

  return (
    <>
      <Audio
        name="Narration"
        from={scene.voiceFrom}
        src={staticFile(scene.src)}
        premountFor={fps}
      />
      {showCaptions && page ? (
        <Interactive.Div
          name="Captions"
          key={index}
          style={{
            position: "absolute",
            left: 100,
            right: 160,
            top,
            fontFamily: headingFont,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.18,
            color: colors.text,
            opacity: interpolate(ms, [page.startMs - 80, page.startMs + 80], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              ms,
              [page.startMs - 80, page.startMs + 200],
              ["0px 24px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          {page.words.map((word, i) => (
            <span
              key={i}
              style={{
                color: ms >= word.startMs && ms < word.endMs ? colors.accent : colors.text,
                opacity: ms >= word.startMs ? 1 : 0.3,
              }}
            >
              {i === 0 ? word.text.trimStart() : word.text}
            </span>
          ))}
        </Interactive.Div>
      ) : null}
    </>
  );
};
