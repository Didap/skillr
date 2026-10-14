"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveReviewAction } from "@/app/actions/reviews";
import { StarRating } from "@/components/ui/star-rating";

interface ReviewFormProps {
  matchId?: string;
  interviewBookingId?: string;
  targetName: string;
  onSuccess?: () => void;
}

const RATING_LABELS = ["Seleziona le stelle", "Scarso", "Sufficiente", "Buono", "Ottimo", "Eccellente"];

export function ReviewForm({
  matchId,
  interviewBookingId,
  targetName,
  onSuccess,
}: ReviewFormProps) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      toast.error("Per favore, seleziona un rating");
      return;
    }

    setLoading(true);
    const res = await saveReviewAction({
      matchId,
      interviewBookingId,
      stars,
      text
    });

    if (res.success) {
      toast.success("Recensione inviata!", {
        description: `Grazie per il tuo feedback su ${targetName}.`,
      });
      onSuccess?.();
    } else {
      toast.error(res.error || "Errore durante l'invio");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <p className="text-viola-500 text-body md:text-center">
        Lascia una recensione per aiutare la community di Helllo.
      </p>

      <div className="flex flex-col items-center gap-3 py-5 px-3 md:p-8 bg-crema rounded-card">
        <StarRating value={stars} onChange={setStars} labels={RATING_LABELS} className="[&_svg]:size-9 md:[&_svg]:size-11" />
        <div className="text-label text-viola" aria-live="polite">
          {RATING_LABELS[stars]}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="review-text" className="flex items-center gap-2 text-label text-viola ml-1">
          <MessageSquare size={16} strokeWidth={1.75} /> Commento (opzionale)
        </label>
        <Textarea
          id="review-text"
          placeholder={`Raccontaci la tua esperienza con ${targetName}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[120px] md:min-h-[140px] rounded-[1.25rem] p-4 md:p-5 text-base md:text-sm leading-relaxed"
          maxLength={500}
        />
        <div className="flex justify-end pr-1">
           <span className="text-label text-viola-400 tabular-nums">{text.length}/500</span>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || stars === 0}
        className="w-full h-14 text-base md:text-lg gap-2"
      >
        {loading ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none" />
                <span>Invio in corso...</span>
            </div>
        ) : (
            <>
                <Sparkles size={20} strokeWidth={1.75} />
                Invia recensione
            </>
        )}
      </Button>
    </div>
  );
}
