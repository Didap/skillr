"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveReviewAction } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";
import { haptic, spring } from "@/lib/motion";

interface ReviewFormProps {
  matchId?: string;
  interviewBookingId?: string;
  targetName: string;
  onSuccess?: () => void;
  /** Hide the "Com'è andata?" title when the container (e.g. the sheet) already shows it */
  showHeading?: boolean;
}

const RATING_LABELS = ["Seleziona le stelle", "Scarso", "Sufficiente", "Buono", "Ottimo", "Eccellente"];

export function ReviewForm({
  matchId,
  interviewBookingId,
  targetName,
  onSuccess,
  showHeading = true
}: ReviewFormProps) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
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

  const shown = hover || stars;

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="text-center space-y-2">
        {showHeading && (
          <h3 className="text-2xl font-display italic text-slate-950 tracking-tight">Com&apos;è andata?</h3>
        )}
        <p className={cn("text-slate-500 text-[15px] md:text-sm font-medium", !showHeading && "text-left md:text-center")}>
          Lascia una recensione per aiutare la community di Skillr.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 md:gap-4 py-5 px-3 md:p-8 bg-slate-50/50 rounded-3xl md:rounded-[2.5rem] border border-slate-100">
        <div role="radiogroup" aria-label="Valutazione" className="flex gap-1" onPointerLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= shown;
            return (
              <motion.button
                key={value}
                type="button"
                role="radio"
                aria-checked={stars === value}
                aria-label={`${value} ${value === 1 ? "stella" : "stelle"}: ${RATING_LABELS[value]}`}
                onClick={() => {
                  setStars(value);
                  haptic();
                }}
                // Hover preview for mouse only: on touch it would stick after the tap
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(value)}
                whileTap={{ scale: 0.85 }}
                animate={{ scale: value <= stars ? 1 : 0.92 }}
                transition={spring.snappy}
                className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Star
                  className={cn(
                    "w-9 h-9 md:w-11 md:h-11 transition-colors duration-150",
                    active ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-50"
                  )}
                />
              </motion.button>
            );
          })}
        </div>
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
