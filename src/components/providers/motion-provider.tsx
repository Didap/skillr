"use client";

import { MotionConfig } from "framer-motion";

// Respect the OS "reduce motion" setting everywhere: framer-motion then skips transform
// and layout animations while keeping opacity changes, so state changes stay legible.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
