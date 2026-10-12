import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skillr | Transparent Professional Matching",
  description: "The Tinder for work: transparent rates, quick matches, zero friction.",
  appleWebApp: {
    capable: true,
    title: "Skillr",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; layouts pad with env(safe-area-inset-*)
  viewportFit: "cover",
  themeColor: "#FDFDFC",
};

import { SessionProvider } from "@/components/providers/session-provider";
import { MotionProvider } from "@/components/providers/motion-provider";

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={cn("h-full", "antialiased", instrumentSerif.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-[#FDFDFC]">
        <SessionProvider>
          <MotionProvider>{children}</MotionProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
