import { Hanken_Grotesk } from "next/font/google";

// Black Italic for the match caption only. Its own module (not app/fonts.ts, which the root
// layout imports) so only routes that render the match screen get its CSS. Not preloaded on
// every dashboard visit: SwipeStack warms it when a like might turn into a match. It shares
// the "Hanken Grotesk" family name with the root instance: italic Hanken at another weight
// would pick this 900 face, so italic stays reserved to this caption (DESIGN.md).
export const hankenBlackItalic = Hanken_Grotesk({
  subsets: ["latin"],
  weight: "900",
  style: "italic",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

/** Starts downloading the caption face (no-op once loaded or where unsupported). */
export function warmMatchFont() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  document.fonts.load(`italic 900 1em ${hankenBlackItalic.style.fontFamily}`).catch(() => {});
}
