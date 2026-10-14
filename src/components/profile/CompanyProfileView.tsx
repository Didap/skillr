import { Button } from "@/components/ui/button";
import { Banknote, Briefcase, Building2, ChevronRight, ExternalLink, Globe, MapPin, Star } from "lucide-react";
import { cn, formatRate, type RateType } from "@/lib/utils";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { circleAction, InfoRow, ProfileReviews, PromptCard, SayHelllo, WhiteCard } from "@/components/profile/ProfileBlocks";
import Image from "next/image";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  location: string | null;
  budgetMaxEur: number | null;
  rateType: RateType | null;
}

interface Review {
  id: string;
  author: { name: string | null; image: string | null } | null;
  stars: number;
  text: string | null;
  createdAt: Date | null;
}

interface CompanyProfileProps {
  profile: {
    companyName: string | null;
    logoUrl: string | null;
    city: string | null;
    industry: string | null;
    description: string | null;
    websiteUrl: string | null;
    averageRating: string | null;
    reviewCount: number | null;
  };
  jobs: Job[];
  reviews: Review[];
}

export function CompanyProfileView({ profile, jobs, reviews }: CompanyProfileProps) {
  const companyName = profile.companyName || "Azienda Partner";
  const rating = Number(profile.averageRating) || 0;

  const websiteButton = profile.websiteUrl ? (
    <a
      href={profile.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Apri il sito web"
      className={circleAction}
    >
      <ExternalLink size={22} strokeWidth={1.75} />
    </a>
  ) : null;

  // Kept as it was: this button has no action wired up yet
  const applyButton = (className?: string) => (
    <Button aria-label="Di' helllo!" className={cn("h-14 px-8", className)}>
      <SayHelllo />
    </Button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header on the viola page: logo, name, industry */}
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative size-20 md:size-24 shrink-0 rounded-card bg-white overflow-hidden flex items-center justify-center">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={companyName}
                fill
                sizes="96px"
                loading="eager"
                className="object-cover"
              />
            ) : (
              <Building2 size={32} strokeWidth={1.75} className="text-viola-300" aria-hidden />
            )}
          </div>
          <div className="min-w-0 text-white">
            <h2 className="text-title wrap-break-word">{companyName}</h2>
            <p className="mt-1 text-body font-medium text-rosa">{profile.industry || "Settore Tecnologico"}</p>
          </div>
        </div>

        {/* Inline actions from md up; phones get the bar at the bottom */}
        <div className="hidden md:flex items-center gap-3">
          {applyButton("min-w-56")}
          {websiteButton}
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3.5">
        {profile.description ? (
          <PromptCard tone="rosa" label="Chi siamo">
            {profile.description}
          </PromptCard>
        ) : (
          <WhiteCard label="Chi siamo">
            <p className="text-body text-viola-500">Questa azienda non ha ancora inserito una descrizione ufficiale.</p>
          </WhiteCard>
        )}

        <WhiteCard label="Da sapere su di noi">
          <ul>
            <InfoRow icon={Building2} label="Settore">
              {profile.industry || "Non specificato"}
            </InfoRow>
            <InfoRow icon={MapPin} label="Città">
              {profile.city || "Sede in Italia"}
            </InfoRow>
            {profile.websiteUrl && (
              <InfoRow icon={Globe} label="Sito web">
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-viola/40 underline-offset-4 hover:decoration-viola break-all"
                >
                  {profile.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              </InfoRow>
            )}
            <InfoRow icon={Star} label="Valutazione">
              {rating > 0 ? profile.averageRating : "Ancora nessuna"} · {profile.reviewCount || 0} feedback
            </InfoRow>
          </ul>
        </WhiteCard>

        <WhiteCard
          label="Ricerche attive"
          action={
            <span className="rounded-full bg-rosa px-3 py-1 text-label text-viola tabular-nums">
              {jobs.length} {jobs.length === 1 ? "posizione aperta" : "posizioni aperte"}
            </span>
          }
        >
          {jobs.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="pressable group flex items-center gap-4 rounded-[1.25rem] bg-crema p-4 hover:bg-rosa"
                  >
                    <span className="size-12 shrink-0 rounded-full bg-white flex items-center justify-center text-viola">
                      <Briefcase size={22} strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-bold text-viola wrap-break-word">{job.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label text-viola-500">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin size={14} strokeWidth={1.75} className="shrink-0" aria-hidden />
                          <span className="truncate">{job.location || "Remoto"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Banknote size={14} strokeWidth={1.75} className="shrink-0" aria-hidden />
                          Fino a {formatRate(job.rateType, job.budgetMaxEur)}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-viola" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-viola-500">Nessuna ricerca attiva al momento.</p>
          )}
        </WhiteCard>
      </div>

      <ProfileReviews
        title={`Recensioni per ${companyName}`}
        averageRating={profile.averageRating}
        reviewCount={profile.reviewCount}
        countLabel="feedback"
        reviews={reviews}
        fallbackAuthor="Candidato Helllo"
        empty={{
          title: "In attesa dei primi feedback",
          text: "Nessun candidato ha ancora lasciato una recensione per questa azienda. Le opinioni certificate appariranno qui.",
        }}
      />

      {/* Phones: actions in thumb reach, above the tab bar */}
      <BottomActionBar variant="floating" desktop="hidden">
        <div className="flex items-center gap-3">
          {applyButton("flex-1 min-w-0")}
          {websiteButton}
        </div>
      </BottomActionBar>
    </div>
  );
}
