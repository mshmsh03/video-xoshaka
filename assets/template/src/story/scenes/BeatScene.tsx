import type React from "react";
import { ChapterLabel } from "../../ChapterLabel";
import { Narration } from "../Narration";
import type { SceneId } from "../voice";

type BeatSceneProps = {
  readonly id: SceneId;
  readonly chapter?: string;
  readonly hideWords?: readonly (readonly [number, number])[];
  readonly showCaptions?: boolean;
  // Caption top; about 1300 for Reels/TikTok (see references/production.md).
  readonly captionTop?: number;
  // The scene's visuals: devices, cards, terminals, counters, stickers...
  // Position them between y 300 and 1400; captions own 1470 and below.
  readonly children?: React.ReactNode;
};

// The frame most scenes share: a chapter label up top, the visuals, and the
// narrator's line with captions at the bottom.
export const BeatScene: React.FC<BeatSceneProps> = ({
  id,
  chapter = "",
  hideWords,
  showCaptions = true,
  captionTop,
  children,
}) => (
  <>
    <ChapterLabel chapter={chapter} />
    {children}
    <Narration id={id} hideWords={hideWords} showCaptions={showCaptions} top={captionTop} />
  </>
);
