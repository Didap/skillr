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
    <div className="p-8 rounded-[2.5rem] bg-white border border-viola-100 shadow-sm hover:shadow-premium transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-viola-50 flex items-center justify-center text-viola-300 border border-viola-100 overflow-hidden shrink-0 relative">
            {authorImage ? (
              <Image 
                src={authorImage} 
                alt={displayName} 
                fill
                className="object-cover" 
              />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <p className="font-bold text-viola-900">{displayName}</p>
            <p className="text-[10px] text-viola-400 font-black uppercase tracking-widest">
              {format(dateToFormat, "MMMM yyyy", { locale: it })}
            </p>
          </div>
        </div>
        <StarRating value={stars} readonly size={18} />
      </div>
      
      {text && (
        <p className="text-text-secondary leading-relaxed italic text-lg">
          &ldquo;{text}&rdquo;
        </p>
      )}
    </div>
  );
}
