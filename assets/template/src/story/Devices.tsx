import type React from "react";
import { Img, staticFile } from "remotion";

type DeviceProps = {
  readonly width: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

// A screenshot from public/, pinned to the top of the screen it fills.
export const Shot: React.FC<{
  readonly src: string;
  readonly style?: React.CSSProperties;
}> = ({ src, style }) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "top",
      ...style,
    }}
  />
);

export const Laptop: React.FC<DeviceProps> = ({ width, children, style }) => (
  <div style={{ width, ...style }}>
    <div
      style={{
        padding: width * 0.018,
        borderRadius: `${width * 0.03}px ${width * 0.03}px 0 0`,
        backgroundColor: "#0B0B0A",
        border: "2px solid #34322E",
        borderBottom: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 10",
          overflow: "hidden",
          borderRadius: 4,
          backgroundColor: "#000",
        }}
      >
        {children}
      </div>
    </div>
    <div
      style={{
        width: width * 1.14,
        height: width * 0.035,
        marginLeft: -width * 0.07,
        borderRadius: `0 0 ${width * 0.03}px ${width * 0.03}px`,
        background: "linear-gradient(#3A3833, #1C1B19)",
        boxShadow: "0 40px 80px rgba(0, 0, 0, 0.6)",
      }}
    />
  </div>
);

export const Phone: React.FC<DeviceProps> = ({ width, children, style }) => (
  <div
    style={{
      width,
      padding: width * 0.035,
      borderRadius: width * 0.16,
      backgroundColor: "#0B0B0A",
      border: "2px solid #34322E",
      boxShadow: "0 40px 90px rgba(0, 0, 0, 0.6)",
      ...style,
    }}
  >
    <div
      style={{
        position: "relative",
        aspectRatio: "390 / 844",
        overflow: "hidden",
        borderRadius: width * 0.13,
        backgroundColor: "#000",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          top: width * 0.03,
          left: "50%",
          width: width * 0.3,
          height: width * 0.085,
          marginLeft: -width * 0.15,
          borderRadius: width,
          backgroundColor: "#000",
        }}
      />
    </div>
  </div>
);
