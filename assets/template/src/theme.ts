import { loadFont as loadHeading } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: headingFont } = loadHeading("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export const { fontFamily: monoFont } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const colors = {
  background: "#141413",
  panel: "#1F1E1C",
  border: "#3A3833",
  text: "#F5F1E8",
  muted: "#A8A296",
  accent: "#D97757",
};
