"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Zap, ExternalLink, Globe, Star, Calendar, FileText, Layout } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { recordSwipe } from "@/app/actions/matches";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Review {
  id: string;
  author: { name: string | null; image: string | null } | null;
  stars: number;
  text: string | null;
  createdAt: Date | null;
}

interface ProfessionalProfileProps {
  profile: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    photoUrl: string | null;
    city: string | null;
    rateAmountEur: number | null;
    rateType: string | null;
    bioShort: string | null;
    bioLong: string | null;
    topSkills: string[] | null;
    secondarySkills: string[] | null;
    cvUrl: string | null;
    portfolioUrls: string[] | null;
    averageRating: string | null;
    reviewCount: number | null;
  };
  reviews: Review[];
  matchId?: string | null;
  professionalId?: string;
  viewerRole?: "professional" | "company" | null;
}

export function ProfessionalProfileView({ profile, reviews, matchId, professionalId, viewerRole }: ProfessionalProfileProps) {
  const [isBooking, setIsBooking] = useState(false);
  const router = useRouter();
  const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "Professionista Anonimo";
  const displayRateType = profile.rateType === "daily" ? "Giorno" : profile.rateType === "hourly" ? "Ora" : "Anno";

  const handleBooking = async () => {
    if (viewerRole !== "company") {
      toast.error("Solo le aziende possono prenotare un'intervista");
      return;
    }

    if (matchId) {
      router.push(`/matches/${matchId}`);
      return;
    }

    if (!professionalId) return;

    setIsBooking(true);
    try {
      const res = await recordSwipe(professionalId, "professional", "right");
      if (res.success) {
        if (res.isMatch) {
          toast.success("È un Match! Ora puoi prenotare il colloquio.");
          router.push(`/matches/${res.matchId}`);
        } else {
          toast.success("Richiesta di colloquio inviata! Riceverai una notifica se il professionista accetta.");
        }
      } else {
        toast.error(res.error || "Errore durante la richiesta");
      }
    } catch (error) {
      toast.error("Errore durante la prenotazione");
    } finally {
      setIsBooking(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-12 items-start mb-16">
        <div className="relative group shrink-0">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] bg-linear-to-br from-emerald-600 to-slate-900 overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            {profile.photoUrl ? (
              <Image 
                src={profile.photoUrl} 
                alt={fullName} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 font-display text-8xl italic font-bold">
                {fullName[0]}
              </div>
            )}
          </div>
          <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
        
        <div className="flex-1 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-4">
               <Zap size={10} fill="currentColor" /> Disponibile per Match
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-950 leading-tight tracking-tight">
              {fullName}
            </h1>
            <p className="text-2xl text-emerald-600 font-semibold mt-2 italic font-display">
              {profile.title || "Professionista esperto"}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-900">{profile.averageRating || "0.0"}</span>
              </div>
              <span className="text-sm font-bold text-slate-400">({profile.reviewCount || 0} recensioni)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-slate-600 font-bold text-sm uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-emerald-500" />
              {profile.city || "Remote / Italia"}
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" />
              €{profile.rateAmountEur || 0} / {displayRateType}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleBooking}
              disabled={isBooking}
              className="rounded-2xl px-10 h-14 text-lg font-black bg-slate-950 hover:bg-emerald-800 text-white transition-all shadow-xl shadow-slate-200"
            >
              {isBooking ? <Loader2 className="animate-spin" size={24} /> : "Prenota Interview"}
            </Button>
            {profile.cvUrl && (
              <a 
                href={profile.cvUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Vedi CV"
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl w-14 h-14 border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-colors"
                )}
              >
                <FileText size={22} className="text-slate-600" />
              </a>
            )}
            {(profile.portfolioUrls && profile.portfolioUrls.length > 0) && (
              <a 
                href={profile.portfolioUrls[0]} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Vedi Portfolio"
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl w-14 h-14 border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-colors"
                )}
              >
                <Layout size={22} className="text-slate-600" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid md:grid-cols-3 gap-12 border-t border-slate-100 pt-12">
        <div className="md:col-span-2 space-y-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biografia</h3>
            <p className="text-xl text-slate-700 leading-relaxed font-medium">
              {profile.bioLong || profile.bioShort || "Il professionista non ha ancora inserito una descrizione dettagliata."}
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timeline & Esperienza</h3>
            <div className="relative pl-8 space-y-10 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              <div className="relative">
                <div className="absolute left-[-29px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="space-y-1">
                  <p className="font-black text-slate-950 text-xl tracking-tight">{profile.title || "In cerca di nuove sfide"}</p>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Attuale • Libero Professionista</p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-slate-500 font-medium">
                La cronologia dettagliata delle esperienze lavorative sarà disponibile nella prossima versione della piattaforma.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-8 flex items-center gap-2">
              <Zap size={12} fill="currentColor" /> Top Skills
            </h3>
            <div className="flex flex-col gap-3">
              {profile.topSkills?.map((skill) => (
                <div key={skill} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:translate-x-1">
                  <span className="font-bold text-slate-800 text-sm">{skill}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              ))}
              {(!profile.topSkills || profile.topSkills.length === 0) && (
                <p className="text-xs text-slate-400 font-bold italic">Nessuna skill principale impostata.</p>
              )}
            </div>
          </div>

          <div className="px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Competenze Extra</h3>
            <div className="flex flex-wrap gap-2">
              {profile.secondarySkills?.map((skill) => (
                <Badge key={skill} variant="outline" className="rounded-xl px-4 py-2 border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors">
                  {skill}
                </Badge>
              ))}
              {(!profile.secondarySkills || profile.secondarySkills.length === 0) && (
                <p className="text-[10px] text-slate-300 font-bold italic">Nessuna competenza secondaria.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-24 border-t border-slate-100 pt-16 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
           <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center md:text-left">Social Proof</h3>
              <h2 className="text-4xl font-display italic font-bold text-slate-950 tracking-tight">Cosa dicono di {profile.firstName}</h2>
           </div>
           <div className="flex flex-col items-center md:items-end gap-1">
              <div className="flex items-center gap-3">
                <div className="flex">
                   {[1, 2, 3, 4, 5].map((s) => (
                     <Star 
                        key={s} 
                        size={20} 
                        className={cn(
                           "transition-all duration-300",
                           s <= Math.round(Number(profile.averageRating)) 
                            ? "fill-amber-400 text-amber-400 scale-110" 
                            : "text-slate-200 fill-slate-50"
                        )}
                     />
                   ))}
                </div>
                <span className="text-3xl font-black text-slate-950 tabular-nums">{profile.averageRating || "0.0"}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media su {profile.reviewCount || 0} incontri</p>
           </div>
        </div>

        {reviews.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((review) => (
                <ReviewCard 
                  key={review.id}
                  authorName={review.author?.name ?? "Utente Skillr"}
                  authorImage={review.author?.image ?? undefined}
                  stars={review.stars}
                  text={review.text}
                  createdAt={review.createdAt}
                />
              ))}
           </div>
        ) : (
           <div className="py-24 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200 text-center px-8 shadow-inner">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-sm">
                <Star size={40} />
              </div>
              <h4 className="text-2xl font-display font-bold text-slate-950 mb-3 tracking-tight">Nuovo talento sulla piattaforma</h4>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Questo professionista non ha ancora concluso incontri certificati. Le recensioni appariranno qui automaticamente.
              </p>
           </div>
        )}
      </section>
    </div>
  );
}
