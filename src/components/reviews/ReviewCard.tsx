"use client";

import { StarRating } from "@/components/ui/star-rating";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { User } from "lucide-react";
import Image from "next/image";

interface ReviewCardProps {
  authorName: string | null;
  authorImage?: string | null;
  stars: number;
  text: string | null;
  createdAt: Date | null;
}

export function ReviewCard({ authorName, authorImage, stars, text, createdAt }: ReviewCardProps) {
  // Obfuscate name: Alessandro Rossi -> Alessandro R.
  const displayName = authorName 
    ? authorName.split(' ')[0] + (authorName.split(' ').length > 1 ? ` ${authorName.split(' ')[1][0]}.` : "")
    : "Utente Helllo";

  const dateToFormat = createdAt ? new Date(createdAt) : new Date();

  return (
    <div className="p-6 rounded-card bg-white border border-viola/15">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-rosa flex items-center justify-center text-viola overflow-hidden shrink-0 relative">
            {authorImage ? (
              <Image
                src={authorImage}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <User size={22} strokeWidth={1.75} />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-viola truncate">{displayName}</p>
            <p className="text-label text-viola-400 first-letter:uppercase">
              {format(dateToFormat, "MMMM yyyy", { locale: it })}
            </p>
          </div>
        </div>
        <StarRating value={stars} readonly size={16} className="shrink-0 pt-1" />
      </div>

      {text && (
        <p className="font-prompt text-xl leading-7 font-medium text-viola wrap-break-word">
          &ldquo;{text}&rdquo;
        </p>
      )}
    </div>
  );
}
