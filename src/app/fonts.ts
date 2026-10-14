import { Hanken_Grotesk, Bricolage_Grotesque, Pacifico } from "next/font/google";

// Every brand font in one place (Next's "font definitions file"): each loader call becomes
// its own hosted instance, so define each once and import it where it is used.

// UI and headlines (Display, Title, Body, Label, Chip)
export const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// The user's own voice (Prompt)
export const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

// One accent word at a time (Accent Script)
export const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
