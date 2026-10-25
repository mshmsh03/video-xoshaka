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

// Periods that don't end a phrase (keep in sync with scripts/make-voice.mjs).
const ABBREVIATION = /^(Mr|Mrs|Ms|Dr|St|Jr|vs|etc|e\.g|i\.e|a\.m|p\.m)\.$/i;
// Arabic-script lines (Arabic, Kurdish Sorani) read right to left. The script
// with more words decides, so a Sorani line that starts with "PHP" still
// reads right to left, and an English line with one Arabic word doesn't.
const RTL_LETTER = /[֐-ࣿיִ-﷿ﹰ-﻿]/gu;
const isRtl = (text: string) => {
  const words = text.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  const rtl = words.filter((w) => w.match(RTL_LETTER)).length;
  return rtl > 0 && rtl >= words.length - rtl;
};

// Short caption pages that break at punctuation, so each reads as a phrase. A
// phrase longer than `maxChars` splits into pages of even length, so no word is
// left alone on a page of its own.
const toPages = (words: Word[], maxChars: number): Page[] => {
  const phrases: Word[][] = [];
  let current: Word[] = [];
  for (const word of words) {
    current.push(word);
    if (/[.,:;?!،؛؟]$/.test(word.text) && !ABBREVIATION.test(word.text.trim())) {
      phrases.push(current);
      current = [];
    }
  }
  if (current.length > 0) phrases.push(current);

  const size = (ws: Word[]) => ws.map((w) => w.text).join("").trim().length;
  const pages: Page[] = [];
  for (const phrase of phrases) {
    const count = Math.ceil(size(phrase) / maxChars);
    let rest = phrase;
    for (let k = count; k > 1 && rest.length > 1; k--) {
      const target = size(rest) / k;
      let cut = 1;
      while (
        cut < rest.length - 1 &&
        Math.abs(size(rest.slice(0, cut + 1)) - target) < Math.abs(size(rest.slice(0, cut)) - target)
      ) {
        cut++;
      }
      // Don't end a page on a little word that leads into the next ("لە", "و",
      // "of"), as long as the rest still fits and no page is left a single word.
      while (cut > 2 && rest[cut - 1].text.trim().length <= 2 && size(rest.slice(cut - 1)) <= (k - 1) * maxChars) {
        cut--;
      }
      pages.push({ words: rest.slice(0, cut), startMs: rest[0].startMs, endMs: rest[cut - 1].endMs });
      rest = rest.slice(cut);
    }
    pages.push({ words: rest, startMs: rest[0].startMs, endMs: rest[rest.length - 1].endMs });
  }
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
  // Landscape layouts: side margins, size, and a longer line per page.
  // `maxChars` is the most that fits on one line at that size and width.
  readonly left?: number;
  readonly right?: number;
  readonly fontSize?: number;
  readonly maxChars?: number;
  readonly align?: "start" | "center";
};

// The narrator's line for a scene, with captions that follow the voice.
export const Narration: React.FC<NarrationProps> = ({
  id,
  hideWords,
  showCaptions = true,
  top = 1470,
  left = 100,
  right = 160,
  fontSize = 64,
  maxChars = 26,
  align = "start",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = sceneVoice(id);
  const ms = ((frame - scene.voiceFrom) / fps) * 1000;
  const pages = toPages(
    scene.captions.filter((_, i) => !hideWords?.some(([from, to]) => i >= from && i <= to)),
    maxChars,
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
            left,
            right,
            top,
            textAlign: align,
            direction: isRtl(page.words.map((w) => w.text).join("")) ? "rtl" : "ltr",
            fontFamily: headingFont,
            fontSize,
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
