import type { Transition } from "framer-motion";

// Shared motion vocabulary. Routine UI stays fast; only the swipe and the match get
// a longer, authored moment. Exits run faster than entrances.

export const ease = {
  // Confident arrival: fast start, long soft landing
  out: [0.16, 1, 0.3, 1] as const,
  // Leaving the screen: accelerate away
  in: [0.7, 0, 0.84, 0] as const,
};

export const duration = {
  feedback: 0.12,
  state: 0.22,
  view: 0.36,
  focal: 0.6,
};

export const spring = {
  // Sheets, tab indicator, cards settling back
  snappy: { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } satisfies Transition,
  // The next card rising from the stack
  card: { type: "spring", stiffness: 300, damping: 30 } satisfies Transition,
  // Bottom sheet open/close
  sheet: { type: "spring", stiffness: 420, damping: 40 } satisfies Transition,
};

// Opacity only: a transform on the page wrapper would make every `position: fixed`
// action bar inside it resolve against the wrapper instead of the viewport mid-animation.
export const pageEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.state, ease: ease.out } },
};

/** Light haptic tick where supported (Android Chrome). iOS Safari has no vibration API. */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw when vibration is blocked by permissions policy
    }
  }
}
