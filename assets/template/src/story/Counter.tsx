import type React from "react";
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, headingFont, monoFont } from "../theme";

type CounterProps = {
  // Seconds into the scene when it starts counting.
  readonly at: number;
  readonly value: number;
  // Shown instead of the number once it lands, e.g. "∞".
  readonly finalText?: string;
  readonly suffix?: string;
  readonly label: string;
  readonly style?: React.CSSProperties;
};

export const Counter: React.FC<CounterProps> = ({
  at,
  value,
  finalText,
  suffix = "",
  label,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = at * fps;
  const progress = interpolate(frame, [start, start + 0.9 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const landed = progress >= 1;

  return (
    <div
      style={{
        opacity: interpolate(frame, [start - 4, start + 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [start - 4, start + 12], ["0px 40px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: finalText && landed ? monoFont : headingFont,
          fontSize: 150,
          fontWeight: 700,
          lineHeight: 1,
          color: colors.accent,
          // The mono ∞ is drawn small; bring it up to the digits' size.
          scale: finalText && landed ? 1.6 : 1,
          transformOrigin: "left center",
        }}
      >
        {finalText && landed ? finalText : `${Math.round(value * progress)}${suffix}`}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: headingFont,
          fontSize: 44,
          fontWeight: 500,
          lineHeight: 1.2,
          color: colors.text,
        }}
      >
        {label}
      </div>
    </div>
  );
};
