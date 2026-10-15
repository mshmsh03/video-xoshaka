import { Audio } from "@remotion/media";
import type React from "react";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, monoFont } from "../theme";

export type TerminalLine = {
  // Seconds into the scene when the line starts.
  readonly at: number;
  readonly text: string;
  // Typed lines appear letter by letter; the others all at once.
  readonly kind: "typed" | "output" | "error" | "success";
  // A sound when the line finishes (a key press, an error ding).
  readonly sound?: string;
};

const CHARS_PER_SECOND = 26;
const LINE_COLORS = {
  typed: colors.text,
  output: colors.muted,
  error: "#E5534B",
  success: "#7FB77E",
};

const typedSeconds = (line: TerminalLine) =>
  line.kind === "typed" ? line.text.length / CHARS_PER_SECOND : 0;

type TerminalProps = {
  readonly title: string;
  readonly lines: readonly TerminalLine[];
  readonly fontSize?: number;
  readonly style?: React.CSSProperties;
};

export const Terminal: React.FC<TerminalProps> = ({
  title,
  lines,
  fontSize = 34,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const visible = lines.filter((line) => t >= line.at);
  const typing = visible[visible.length - 1];
  const cursorOn = Math.floor(frame / (fps / 2)) % 2 === 0;

  return (
    <div
      style={{
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#0E0E0D",
        border: `2px solid ${colors.border}`,
        boxShadow: "0 40px 90px rgba(0, 0, 0, 0.5)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "22px 28px",
          backgroundColor: colors.panel,
          borderBottom: `2px solid ${colors.border}`,
          fontFamily: monoFont,
          fontSize: 28,
          color: colors.muted,
        }}
      >
        {["#E5534B", "#E3B341", "#7FB77E"].map((c) => (
          <div key={c} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c }} />
        ))}
        <div style={{ marginLeft: 14 }}>{title}</div>
      </div>
      <div
        style={{
          padding: "30px 34px 36px",
          fontFamily: monoFont,
          fontSize,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
        }}
      >
        {visible.map((line, i) => {
          const shown =
            line.kind === "typed"
              ? line.text.slice(0, Math.floor((t - line.at) * CHARS_PER_SECOND))
              : line.text;
          return (
            <div key={i} style={{ color: LINE_COLORS[line.kind] }}>
              {shown}
              {line === typing && cursorOn ? (
                <span style={{ color: colors.accent }}>▋</span>
              ) : null}
            </div>
          );
        })}
      </div>
      {lines.map((line, i) =>
        line.sound ? (
          <Audio
            key={i}
            name={`Terminal sound ${i + 1}`}
            from={Math.round((line.at + typedSeconds(line)) * fps)}
            src={staticFile(line.sound)}
            volume={line.kind === "error" ? 0.5 : 0.25}
            premountFor={fps}
          />
        ) : null,
      )}
    </div>
  );
};
