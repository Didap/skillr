import { Hanken_Grotesk, Bricolage_Grotesque, Pacifico } from "next/font/google";

// Root-layout fonts, defined once (Next's "font definitions file"). Their roles are in
// DESIGN.md. The match caption's Black Italic lives in components/swipe/match-font.ts.

export const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
