"use client";

import { StarRating } from "@/components/ui/star-rating";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { User } from "lucide-react";

interface ReviewCardProps {
  authorName: string | null;
  stars: number;
  text: string | null;
  createdAt: Date | null;
}

export function ReviewCard({ authorName, stars, text, createdAt }: ReviewCardProps) {
  // Obfuscate name: Alessandro -> A.
  const displayName = authorName 
    ? authorName.split(' ')[0] + (authorName.split(' ').length > 1 ? ` ${authorName.split(' ')[1][0]}.` : "")
    : "Utente Skillr";

  const dateToFormat = createdAt ? new Date(createdAt) : new Date();

  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-border-subtle shadow-sm hover:shadow-premium transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-warm flex items-center justify-center text-primary/40 border border-border-subtle">
            <User size={24} />
          </div>
          <div>
            <p className="font-bold text-text-primary">{displayName}</p>
            <p className="text-xs text-text-muted font-medium uppercase tracking-widest">
              {format(dateToFormat, "MMMM yyyy", { locale: it })}
            </p>
          </div>
        </div>
        <StarRating value={stars} onChange={() => {}} readonly size={18} />
      </div>
      
      {text && (
        <p className="text-text-secondary leading-relaxed italic text-lg">
          &ldquo;{text}&rdquo;
        </p>
      )}
    </div>
  );
}
