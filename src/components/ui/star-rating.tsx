"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic, spring } from "@/lib/motion";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  className?: string;
  /** Icon size; interactive stars also get at least a 48px (56px from md) tap target */
  size?: number;
  readonly?: boolean;
  /** Accessible names per value, e.g. ["", "Scarso", ...]; index = number of stars */
  labels?: string[];
}

export function StarRating({
  value,
  onChange,
  max = 5,
  className,
  size = 36,
  readonly = false,
  labels,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = (!readonly && hover) || value;

  if (readonly) {
    return (
      <div className={cn("flex gap-1", className)} role="img" aria-label={`${value} su ${max} stelle`}>
        {Array.from({ length: max }, (_, i) => (
          <Star
            key={i}
            size={size}
            className={i < value ? "fill-amber-400 text-amber-400" : "text-viola-200 fill-viola-50"}
          />
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Valutazione" className={cn("flex gap-1", className)} onPointerLeave={() => setHover(0)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        return (
          <motion.button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} ${starValue === 1 ? "stella" : "stelle"}${labels?.[starValue] ? `: ${labels[starValue]}` : ""}`}
            onClick={() => {
              onChange?.(starValue);
              haptic();
            }}
            // Hover preview for mouse only: on touch it would stick after the tap
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(starValue)}
            whileTap={{ scale: 0.85 }}
            animate={{ scale: starValue <= value ? 1 : 0.92 }}
            transition={spring.snappy}
            className="min-w-12 min-h-12 md:min-w-14 md:min-h-14 flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Star
              size={size}
              className={cn(
                "transition-colors duration-150",
                starValue <= shown ? "fill-amber-400 text-amber-400" : "text-viola-200 fill-viola-50"
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
