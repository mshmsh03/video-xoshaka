import type React from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, monoFont } from "./theme";

export const ChapterLabel: React.FC<{ readonly chapter: string }> = ({
  chapter,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!chapter) {
    return null;
  }

  return (
    <Interactive.Div
      name="Chapter"
      style={{
        position: "absolute",
        left: 100,
        right: 100,
        top: 180,
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontFamily: monoFont,
        fontSize: 40,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: colors.muted,
        opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div style={{ width: 48, height: 4, backgroundColor: colors.accent }} />
      {chapter}
    </Interactive.Div>
  );
};
