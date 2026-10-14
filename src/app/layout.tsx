import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { hanken, bricolage, pacifico } from "./fonts";

export const metadata: Metadata = {
  title: "Helllo | Il lavoro parte da un ciao",
  description: "Match di lavoro trasparenti: compensi in chiaro, swipe e una call per rompere il ghiaccio.",
  appleWebApp: {
    capable: true,
    title: "Helllo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; layouts pad with env(safe-area-inset-*)
  viewportFit: "cover",
  themeColor: "#FFFFFF",
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
      className={cn("h-full", "antialiased", hanken.variable, bricolage.variable, pacifico.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col font-sans text-viola bg-background">
        <SessionProvider>
          <MotionProvider>{children}</MotionProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
