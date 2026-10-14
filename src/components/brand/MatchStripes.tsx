import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// One cursive "l" from the match illustration (Figma "Coppia", v2). Repeated every PERIOD
// units it chains into an endless "llll…", which is what lets the band scroll forever.
const STRIPE =
  "M133.324 254.233C135.362 257.495 136.381 261.957 136.381 267.642C136.381 278.491 133.799 286.871 128.66 292.828C117.022 307.188 104.343 318.965 90.6899 328.184C77.0144 337.402 61.5048 342 44.1839 342C20.3423 342 2.682 331.174 -8.81996 309.498C-20.3219 287.822 -26.0729 259.782 -26.0729 225.378C-26.0729 190.973 -21.8165 154.666 -13.2806 112.402C-4.74467 70.1377 7.84423 33.8532 24.5085 3.50283C41.1727 -26.8249 61.0069 -42 84.0108 -42C97.0071 -42 107.218 -35.9753 114.69 -23.9257C122.139 -11.8762 125.852 5.40542 125.852 27.8738C125.852 60.1267 116.909 97.4985 99.0449 140.034C81.1806 182.57 56.9312 224.698 26.3423 266.419C28.2216 277.539 31.3461 285.444 35.6933 290.201C40.0179 294.934 45.701 297.313 52.7652 297.313C63.8596 297.313 73.6183 294.142 82.0183 287.754C90.4184 281.39 101.105 270.495 114.101 255.048C117.362 251.266 121.007 249.364 125.06 249.364C128.57 249.364 131.354 250.994 133.392 254.233H133.324ZM53.9199 31.9732C46.0633 54.4642 39.1575 82.3686 33.2028 115.686C27.248 149.004 23.9878 180.985 23.4444 211.584C42.6671 179.897 57.9727 148.12 69.3388 116.298C80.7049 84.475 86.4106 55.4154 86.4106 29.142C86.4106 8.55356 82.6068 -1.75201 75.0445 -1.75201C68.818 -1.75201 61.7766 9.48219 53.9199 31.9732Z";
const PERIOD = 133.373;
// The Figma frame is 358x290; draw one extra period so the band can slide by exactly one
const FRAME_W = 358;
const BAND_W = FRAME_W + PERIOD;
const COPIES = [-1, 0, 1, 2, 3];

/**
 * The wavy stripes behind the match cards, meant to sit inside a rosa block that clips it
 * (overflow-hidden, rounded). Paints with currentColor (crema by default). With `loop` the
 * band drifts left forever, one "l" every `secondsPerLoop`: a CSS animation on transform,
 * so it runs on the compositor, not in JS every frame. Still with reduced motion.
 */
export function MatchStripes({
  className,
  loop = false,
  secondsPerLoop = 9,
}: {
  className?: string;
  loop?: boolean;
  secondsPerLoop?: number;
}) {
  const style = {
    width: `${(BAND_W / FRAME_W) * 100}%`,
    "--stripes-shift": `${(-PERIOD / BAND_W) * 100}%`,
    animationDuration: `${secondsPerLoop}s`,
  } as CSSProperties;

  return (
    <svg
      viewBox={`0 0 ${BAND_W} 290`}
      preserveAspectRatio="none"
      fill="currentColor"
      className={cn(
        "absolute inset-y-0 left-0 h-full text-crema",
        loop && "animate-stripes-drift motion-reduce:animate-none",
        className
      )}
      style={style}
      aria-hidden="true"
    >
      {COPIES.map((k) => (
        <path key={k} d={STRIPE} transform={`translate(${k * PERIOD} 0)`} />
      ))}
    </svg>
  );
}
