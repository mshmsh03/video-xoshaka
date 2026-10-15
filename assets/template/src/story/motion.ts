import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Fades an element in while it rises into place, starting at `start` (frames).
export const fadeUp = (frame: number, start: number, fps: number, distance = 40) => ({
  opacity: interpolate(frame, [start, start + 0.35 * fps], [0, 1], clamp),
  translate: interpolate(
    frame,
    [start, start + 0.6 * fps],
    [`0px ${distance}px`, "0px 0px"],
    { ...clamp, easing: easeOut },
  ),
});

// Pops an element in with a little overshoot, like a sticker slapped on.
export const popIn = (frame: number, start: number, fps: number) => ({
  opacity: interpolate(frame, [start, start + 2], [0, 1], clamp),
  scale: interpolate(frame, [start, start + 0.45 * fps], [1.8, 1], {
    ...clamp,
    easing: Easing.spring({ damping: 9 }),
    output: "perceptual-scale",
  }),
});

export const appear = (frame: number, start: number, fps: number) =>
  interpolate(frame, [start, start + 0.3 * fps], [0, 1], clamp);
