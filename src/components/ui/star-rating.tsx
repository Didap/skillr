"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ 
  value, 
  onChange, 
  max = 5, 
  className, 
  size = 32,
  readonly = false
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hover || value);
        
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-all duration-200 transform",
              !readonly && "hover:scale-125 active:scale-95",
              readonly ? "cursor-default" : "cursor-pointer"
            )}
            onMouseEnter={() => !readonly && setHover(starValue)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange(starValue)}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isActive 
                  ? "fill-amber-400 text-amber-400" 
                  : "text-slate-200 fill-slate-50"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
