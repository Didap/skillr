"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

/**
 * A number that rolls up when it grows and down when it shrinks, so booking or cancelling a
 * seat visibly moves the counter instead of silently swapping the digit.
 */
export function SeatCount({ value, className }: { value: number; className?: string }) {
  // Previous value kept in state (React's "store info from previous renders" pattern)
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState(1);
  if (value !== prev) {
    setDir(value > prev ? 1 : -1);
    setPrev(value);
  }

  return (
    <span className={cn("relative inline-flex overflow-hidden tabular-nums align-bottom", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          variants={{
            enter: (d: number) => ({ y: d > 0 ? "100%" : "-100%", opacity: 0 }),
            center: { y: 0, opacity: 1, transition: { duration: duration.state, ease: ease.out } },
            exit: (d: number) => ({
              y: d > 0 ? "-100%" : "100%",
              opacity: 0,
              transition: { duration: duration.feedback, ease: ease.in },
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
