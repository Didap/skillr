"use client";

import { Button } from "@/components/ui/button";
import {
  Banknote,
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  ImageIcon,
  Layout,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import { cn, formatRate, type RateType } from "@/lib/utils";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import Image from "next/image";
import {
  Chip,
  circleAction,
  InfoRow,
  ProfileReviews,
  PromptCard,
  SayHelllo,
  WhiteCard,
} from "@/components/profile/ProfileBlocks";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { recordSwipe } from "@/app/actions/matches";
import { useState } from "react";

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
          toast.success("È un helllo! Ora puoi fissare il colloquio.");
          router.push(`/matches/${res.matchId}`);
        } else {
          toast.success("Helllo inviato! Riceverai una notifica se il professionista ricambia.");
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
  
  const bookingLabel = matchId ? "Fissa un colloquio" : "Di' helllo!";
  const bookContent = isBooking ? (
    <Loader2 className="animate-spin motion-reduce:animate-none" size={22} />
  ) : matchId ? (
    <>
      <Calendar size={20} strokeWidth={1.75} aria-hidden /> Fissa un colloquio
    </>
  ) : (
    <SayHelllo />
  );

  const bookButton = (className?: string) => (
    <Button
      onClick={handleBooking}
      disabled={isBooking}
      aria-label={bookingLabel}
      className={cn("h-14 px-8 text-lg gap-2", className)}
    >
      {bookContent}
    </Button>
  );

  const cvLink = profile.cvUrl ? (
    <a
      href={profile.cvUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Vedi CV"
      aria-label="Vedi CV"
      className={circleAction}
    >
      <FileText size={22} strokeWidth={1.75} />
    </a>
  ) : null;

  const portfolioUrls = profile.portfolioUrls ?? [];
  const portfolioLink = portfolioUrls.length > 0 ? (
    <a
      href={portfolioUrls[0]}
      target="_blank"
      rel="noopener noreferrer"
      title="Vedi Portfolio"
      aria-label="Vedi Portfolio"
      className={circleAction}
    >
      <Layout size={22} strokeWidth={1.75} />
    </a>
  ) : null;

  const topSkills = profile.topSkills ?? [];
  const secondarySkills = profile.secondarySkills ?? [];
  const rating = Number(profile.averageRating) || 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header on the blu page: name, role, photo */}
      <header className="space-y-4">
        <div className="text-white">
          <h2 className="text-title wrap-break-word">{fullName}</h2>
          <p className="mt-1 text-body font-medium text-rosa">{profile.title || "Professionista esperto"}</p>
        </div>

        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-card overflow-hidden bg-crema">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={fullName}
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              loading="eager"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="size-24 rounded-full bg-rosa text-viola text-display flex items-center justify-center">
                {fullName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Inline actions from md up; phones get the bar at the bottom */}
        <div className="hidden md:flex items-center gap-3">
          {bookButton("min-w-56")}
          {cvLink}
          {portfolioLink}
        </div>
      </header>

      <div className="mt-3.5 flex flex-col gap-3.5">
        {profile.bioShort && (
          <PromptCard tone="rosa" label="In breve">
            {profile.bioShort}
          </PromptCard>
        )}

        <WhiteCard label="Da sapere su di me">
          <ul>
            <InfoRow icon={Briefcase} label="Ruolo">
              {profile.title || "Professionista esperto"}
            </InfoRow>
            <InfoRow icon={MapPin} label="Città">
              {profile.city || "Remote / Italia"}
            </InfoRow>
            <InfoRow icon={Banknote} label="Tariffa">
              {formatRate(profile.rateType, profile.rateAmountEur || 0)}
            </InfoRow>
            <InfoRow icon={Star} label="Valutazione">
              {rating > 0 ? profile.averageRating : "Ancora nessuna"} · {profile.reviewCount || 0} recensioni
            </InfoRow>
          </ul>
        </WhiteCard>

        {profile.bioLong ? (
          <PromptCard tone="viola" label="Su di me">
            {profile.bioLong}
          </PromptCard>
        ) : (
          !profile.bioShort && (
            <WhiteCard label="Su di me">
              <p className="text-body text-viola-500">
                Il professionista non ha ancora inserito una descrizione dettagliata.
              </p>
            </WhiteCard>
          )
        )}

        <WhiteCard label="Competenze">
          {topSkills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </ul>
          ) : (
            <p className="text-body text-viola-500">Nessuna skill principale impostata.</p>
          )}
          {secondarySkills.length > 0 && (
            <>
              <h4 className="mt-2 text-label text-viola">Competenze extra</h4>
              <ul className="flex flex-wrap gap-2">
                {secondarySkills.map((skill) => (
                  <Chip key={skill} variant="outline">
                    {skill}
                  </Chip>
                ))}
              </ul>
            </>
          )}
        </WhiteCard>

        {(portfolioUrls.length > 0 || profile.cvUrl) && (
          <WhiteCard label="I miei lavori">
            <ul className="flex flex-col gap-3">
              {portfolioUrls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pressable group flex items-center gap-4 rounded-[1.25rem] bg-crema p-3 pr-4 hover:bg-rosa"
                  >
                    <span className="size-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-viola">
                      <ImageIcon size={24} strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-viola truncate">{hostname(url)}</span>
                      <span className="block text-label text-viola-500">Portfolio</span>
                    </span>
                    <ExternalLink size={18} strokeWidth={1.75} className="shrink-0 text-viola" aria-hidden />
                  </a>
                </li>
              ))}
              {profile.cvUrl && (
                <li>
                  <a
                    href={profile.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pressable group flex items-center gap-4 rounded-[1.25rem] bg-crema p-3 pr-4 hover:bg-rosa"
                  >
                    <span className="size-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-viola">
                      <FileText size={24} strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 block text-body font-medium text-viola">Curriculum</span>
                    <ExternalLink size={18} strokeWidth={1.75} className="shrink-0 text-viola" aria-hidden />
                  </a>
                </li>
              )}
            </ul>
          </WhiteCard>
        )}
      </div>

      <ProfileReviews
        title={`Cosa dicono di ${profile.firstName || fullName}`}
        averageRating={profile.averageRating}
        reviewCount={profile.reviewCount}
        countLabel="incontri"
        reviews={reviews}
        fallbackAuthor="Utente Helllo"
        empty={{
          title: "Nuovo talento su Helllo",
          text: "Questo professionista non ha ancora concluso incontri certificati. Le recensioni appariranno qui automaticamente.",
        }}
      />

      {/* Phones: actions in thumb reach, above the tab bar */}
      <BottomActionBar variant="floating" desktop="hidden">
        <div className="flex items-center gap-3">
          {bookButton("flex-1 min-w-0")}
          {cvLink}
          {portfolioLink}
        </div>
      </BottomActionBar>
    </div>
  );
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
