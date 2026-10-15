import { Video } from "@remotion/media";
import type React from "react";
import { AnimatedImage, getStaticFiles, Img, useVideoConfig } from "remotion";
import { colors, headingFont } from "../theme";

// Photos and clips are optional: drop public/photos/<base>.jpg (or .png,
// .webp, .gif, .mp4, .mov, .webm) in and it replaces the initial.
export const findMedia = (base: string) =>
  getStaticFiles().find((file) =>
    new RegExp(`^photos/${base}\\.(jpe?g|png|webp|gif|mp4|mov|webm)$`, "i").test(file.name),
  );

type PhotoCardProps = {
  readonly base: string;
  readonly name: string;
  readonly initial: string;
  readonly size: number;
  // Height / width of the clip, and which part of it to keep in the square
  // (0 = top, 1 = bottom). Without them the media is centered.
  readonly mediaAspect?: number;
  readonly focusY?: number;
  readonly style?: React.CSSProperties;
};

export const PhotoCard: React.FC<PhotoCardProps> = ({
  base,
  name,
  initial,
  size,
  mediaAspect,
  focusY = 0.5,
  style,
}) => {
  const { fps } = useVideoConfig();
  const media = findMedia(base);
  const isVideo = media ? /\.(mp4|mov|webm)$/i.test(media.name) : false;
  const isGif = media ? /\.gif$/i.test(media.name) : false;
  const mediaHeight = mediaAspect ? size * mediaAspect : size;
  const fill: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: -(mediaHeight - size) * focusY,
    width: size,
    height: mediaHeight,
  };

  return (
    <div
      style={{
        padding: size * 0.05,
        paddingBottom: 0,
        borderRadius: 10,
        backgroundColor: colors.text,
        boxShadow: "0 40px 90px rgba(0, 0, 0, 0.55)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: 4,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.panel,
        }}
      >
        {media && isVideo ? (
          <Video
            name={`${name} clip`}
            src={media.src}
            muted
            loop
            objectFit="cover"
            premountFor={fps}
            style={fill}
          />
        ) : media && isGif ? (
          <AnimatedImage src={media.src} fit="cover" style={fill} />
        ) : media ? (
          <Img src={media.src} style={{ ...fill, objectFit: "cover" }} />
        ) : (
          <span
            style={{
              fontFamily: headingFont,
              fontSize: size * 0.46,
              fontWeight: 700,
              color: colors.accent,
            }}
          >
            {initial}
          </span>
        )}
      </div>
      <div
        style={{
          height: size * 0.24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: headingFont,
          fontSize: Math.max(36, size * 0.1),
          fontWeight: 700,
          color: colors.background,
        }}
      >
        {name}
      </div>
    </div>
  );
};
