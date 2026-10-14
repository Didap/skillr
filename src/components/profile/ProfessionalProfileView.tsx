"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Zap, Star, FileText, Layout } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { cn, formatRate, type RateType } from "@/lib/utils";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
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
    rateType: RateType | null;
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
    } catch {
      toast.error("Errore durante la prenotazione");
    } finally {
      setIsBooking(false);
    }
  };
  
  const bookLabel = isBooking ? <Loader2 className="animate-spin" size={22} /> : "Prenota Interview";

  const cvLink = profile.cvUrl ? (
    <a
      href={profile.cvUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Vedi CV"
      aria-label="Vedi CV"
      className="pressable inline-flex shrink-0 items-center justify-center rounded-2xl w-12 h-12 md:w-14 md:h-14 border border-viola-100 bg-white shadow-sm hover:bg-viola-50 transition-colors"
    >
      <FileText size={22} className="text-viola-600" />
    </a>
  ) : null;

  const portfolioLink = profile.portfolioUrls && profile.portfolioUrls.length > 0 ? (
    <a
      href={profile.portfolioUrls[0]}
      target="_blank"
      rel="noopener noreferrer"
      title="Vedi Portfolio"
      aria-label="Vedi Portfolio"
      className="pressable inline-flex shrink-0 items-center justify-center rounded-2xl w-12 h-12 md:w-14 md:h-14 border border-viola-100 bg-white shadow-sm hover:bg-viola-50 transition-colors"
    >
      <Layout size={22} className="text-viola-600" />
    </a>
  ) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-6 md:gap-12 items-start mb-10 md:mb-16">
        <div className="relative group shrink-0">
          <div className="w-28 h-28 md:w-56 md:h-56 rounded-[2rem] md:rounded-[2.5rem] bg-linear-to-br from-rosso-600 to-viola-900 overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 md:group-hover:scale-[1.02]">
            {profile.photoUrl ? (
              <Image
                src={profile.photoUrl}
                alt={fullName}
                fill
                sizes="(min-width: 768px) 224px, 112px"
                loading="eager"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 font-display text-6xl md:text-8xl font-bold">
                {fullName[0]}
              </div>
            )}
          </div>
          <div className="absolute -inset-4 bg-rosso-500/10 blur-3xl rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        <div className="flex-1 min-w-0 w-full space-y-5 md:space-y-6">
          <div>
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rosso-50 text-rosso-700 text-[11px] font-black uppercase tracking-widest mb-4">
              <Zap size={10} fill="currentColor" /> Disponibile per Match
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-viola-950 leading-[1.05] md:leading-tight tracking-tight wrap-break-word">
              {fullName}
            </h2>
            <p className="text-xl md:text-2xl text-rosso-600 font-semibold mt-1 md:mt-2 font-display">
              {profile.title || "Professionista esperto"}
            </p>
            <div className="flex items-center gap-3 mt-3 md:mt-4">
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-900">{profile.averageRating || "0.0"}</span>
              </div>
              <span className="text-sm font-bold text-viola-500">({profile.reviewCount || 0} recensioni)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-6 text-viola-600 font-bold text-sm md:uppercase md:tracking-wider">
            <div className="flex items-center gap-2 h-9 md:h-auto px-3 md:px-0 rounded-full bg-viola-50 md:bg-transparent border border-viola-100 md:border-0">
              <MapPin size={16} className="text-rosso-500 shrink-0" />
              {profile.city || "Remote / Italia"}
            </div>
            <div className="flex items-center gap-2 h-9 md:h-auto px-3 md:px-0 rounded-full bg-viola-50 md:bg-transparent border border-viola-100 md:border-0">
              <DollarSign size={16} className="text-rosso-500 shrink-0" />
              {formatRate(profile.rateType, profile.rateAmountEur || 0)}
            </div>
          </div>

          {/* Inline actions from md up; phones get the sticky bar below */}
          <div className="hidden md:flex gap-4 pt-4">
            <Button
              onClick={handleBooking}
              disabled={isBooking}
              className="pressable rounded-2xl px-10 h-14 text-lg font-black bg-viola-950 hover:bg-rosso-800 text-white transition-colors shadow-xl shadow-viola-200"
            >
              {bookLabel}
            </Button>
            {cvLink}
            {portfolioLink}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid md:grid-cols-3 gap-10 md:gap-12 border-t border-viola-100 pt-8 md:pt-12">
        <div className="md:col-span-2 space-y-10 md:space-y-12">
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-viola-500">Biografia</h3>
            <p className="text-base md:text-xl text-viola-700 leading-relaxed font-medium">
              {profile.bioLong || profile.bioShort || "Il professionista non ha ancora inserito una descrizione dettagliata."}
            </p>
          </div>

          <div className="space-y-5 md:space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-viola-500">Timeline & Esperienza</h3>
            <div className="relative pl-8 space-y-8 md:space-y-10 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-viola-100">
              <div className="relative">
                <div className="absolute left-[-29px] top-1.5 w-3.5 h-3.5 rounded-full bg-rosso-500 ring-4 ring-white" />
                <div className="space-y-1">
                  <p className="font-black text-viola-950 text-lg md:text-xl tracking-tight">{profile.title || "In cerca di nuove sfide"}</p>
                  <p className="text-viola-500 font-bold text-sm uppercase tracking-wide">Attuale • Libero Professionista</p>
                </div>
              </div>
              <div className="p-5 md:p-8 bg-viola-50 rounded-3xl md:rounded-[2rem] border border-viola-100 italic text-viola-500 font-medium">
                La cronologia dettagliata delle esperienze lavorative sarà disponibile nella prossima versione della piattaforma.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 md:space-y-12">
          <div className="bg-viola-50 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-viola-100 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-rosso-700 mb-5 md:mb-8 flex items-center gap-2">
              <Zap size={12} fill="currentColor" /> Top Skills
            </h3>
            <div className="flex flex-col gap-3">
              {profile.topSkills?.map((skill) => (
                <div key={skill} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-viola-100 shadow-sm transition-transform md:hover:translate-x-1">
                  <span className="font-bold text-viola-800 text-sm min-w-0 truncate">{skill}</span>
                  <div className="w-2 h-2 shrink-0 rounded-full bg-rosso-500" />
                </div>
              ))}
              {(!profile.topSkills || profile.topSkills.length === 0) && (
                <p className="text-sm text-viola-500 font-bold italic">Nessuna skill principale impostata.</p>
              )}
            </div>
          </div>

          <div className="md:px-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-viola-500 mb-4 md:mb-6">Competenze Extra</h3>
            <div className="flex flex-wrap gap-2">
              {profile.secondarySkills?.map((skill) => (
                <Badge key={skill} variant="outline" className="h-auto rounded-xl px-4 py-2 border-viola-200 bg-white text-viola-600 font-bold text-[11px] uppercase tracking-wider hover:bg-viola-50 transition-colors">
                  {skill}
                </Badge>
              ))}
              {(!profile.secondarySkills || profile.secondarySkills.length === 0) && (
                <p className="text-sm text-viola-500 font-bold italic">Nessuna competenza secondaria.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-12 md:mt-24 border-t border-viola-100 pt-10 md:pt-16 pb-8 md:pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 mb-8 md:mb-12">
          <div className="space-y-3">
            <h3 className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] text-viola-500 md:text-left">Social Proof</h3>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-viola-950 tracking-tight">Cosa dicono di {profile.firstName}</h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
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
                        : "text-viola-200 fill-viola-50"
                    )}
                  />
                ))}
              </div>
              <span className="text-3xl font-black text-viola-950 tabular-nums">{profile.averageRating || "0.0"}</span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-viola-500">Media su {profile.reviewCount || 0} incontri</p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                authorName={review.author?.name ?? "Utente Helllo"}
                authorImage={review.author?.image ?? undefined}
                stars={review.stars}
                text={review.text}
                createdAt={review.createdAt}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 md:py-24 bg-viola-50 rounded-[2rem] md:rounded-[3.5rem] border-2 border-dashed border-viola-200 text-center px-6 md:px-8 shadow-inner">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 text-viola-200 shadow-sm">
              <Star size={36} />
            </div>
            <h4 className="text-2xl font-display font-bold text-viola-950 mb-3 tracking-tight">Nuovo talento sulla piattaforma</h4>
            <p className="text-viola-500 font-medium max-w-sm mx-auto leading-relaxed">
              Questo professionista non ha ancora concluso incontri certificati. Le recensioni appariranno qui automaticamente.
            </p>
          </div>
        )}
      </section>

      {/* Phones: primary action in thumb reach, above the tab bar */}
      <BottomActionBar variant="floating" desktop="hidden">
        <div className="flex items-center gap-2 rounded-[1.25rem] bg-white/90 backdrop-blur-xl border border-viola-100 p-2 shadow-premium">
          <Button
            onClick={handleBooking}
            disabled={isBooking}
            className="pressable flex-1 min-w-0 rounded-2xl h-12 text-base font-black bg-viola-950 hover:bg-rosso-800 text-white transition-colors"
          >
            {bookLabel}
          </Button>
          {cvLink}
          {portfolioLink}
        </div>
      </BottomActionBar>
    </div>
  );
}
