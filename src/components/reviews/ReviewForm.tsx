"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveReviewAction } from "@/app/actions/reviews";
import { MessageSquare, Sparkles } from "lucide-react";

interface ReviewFormProps {
  matchId?: string;
  interviewBookingId?: string;
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ 
  matchId, 
  interviewBookingId, 
  targetId, 
  targetName,
  onSuccess 
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
      targetId,
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
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Com&apos;è andata?</h3>
        <p className="text-slate-500 text-sm font-medium">Lascia una recensione per aiutare la community di Skillr.</p>
      </div>

      <div className="flex flex-col items-center gap-6 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
        <StarRating value={stars} onChange={setStars} size={48} />
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {stars === 0 ? "Seleziona le stelle" : 
           stars === 1 ? "Scarso" :
           stars === 2 ? "Sufficiente" :
           stars === 3 ? "Buono" :
           stars === 4 ? "Ottimo" : "Eccellente"}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-3">
          <MessageSquare size={14} /> Commento (opzionale)
        </label>
        <Textarea
          placeholder={`Raccontaci la tua esperienza con ${targetName}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[140px] rounded-[2rem] border-slate-100 focus:ring-primary/20 bg-white p-6 text-sm leading-relaxed"
          maxLength={500}
        />
        <div className="flex justify-end pr-3">
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{text.length}/500</span>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || stars === 0}
        className="w-full h-16 rounded-[1.25rem] text-lg font-black bg-slate-950 hover:bg-emerald-800 transition-all shadow-xl shadow-slate-200 gap-2 active:scale-95"
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
