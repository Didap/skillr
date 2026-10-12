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
    <div className="space-y-5 md:space-y-8">
      <p className="text-slate-500 text-[15px] md:text-sm font-medium md:text-center">
        Lascia una recensione per aiutare la community di Skillr.
      </p>

      <div className="flex flex-col items-center gap-3 md:gap-4 py-5 px-3 md:p-8 bg-slate-50/50 rounded-3xl md:rounded-[2.5rem] border border-slate-100">
        <StarRating value={stars} onChange={setStars} labels={RATING_LABELS} className="[&_svg]:size-9 md:[&_svg]:size-11" />
        <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]" aria-live="polite">
          {RATING_LABELS[stars]}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <label htmlFor="review-text" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 md:ml-3">
          <MessageSquare size={14} /> Commento (opzionale)
        </label>
        <Textarea
          id="review-text"
          placeholder={`Raccontaci la tua esperienza con ${targetName}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[120px] md:min-h-[140px] rounded-2xl md:rounded-[2rem] border-slate-200 focus:ring-primary/20 bg-white p-4 md:p-6 text-base md:text-sm leading-relaxed"
          maxLength={500}
        />
        <div className="flex justify-end pr-1 md:pr-3">
           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{text.length}/500</span>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || stars === 0}
        className="pressable w-full h-14 md:h-16 rounded-[1.25rem] text-base md:text-lg font-black bg-slate-950 text-white hover:bg-emerald-800 transition-colors shadow-xl shadow-slate-200 gap-2"
      >
        {loading ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Invio in corso...</span>
            </div>
        ) : (
            <>
                <Sparkles size={20} className="text-amber-400" />
                Invia Recensione
            </>
        )}
      </Button>
    </div>
  );
}
