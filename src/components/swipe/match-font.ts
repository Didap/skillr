import { Hanken_Grotesk } from "next/font/google";

// Black Italic for the match caption only. Its own module (not app/fonts.ts, which the root
// layout imports) so only routes that render the match screen get its CSS and preload, and
// it is ready before the caption fades in. It shares the "Hanken Grotesk" family name with
// the root instance: italic Hanken at another weight would pick this 900 face, so italic
// stays reserved to this caption (DESIGN.md).
export const hankenBlackItalic = Hanken_Grotesk({
  subsets: ["latin"],
  weight: "900",
  style: "italic",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
