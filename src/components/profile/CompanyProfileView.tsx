import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Star, Briefcase, Building2, ExternalLink, DollarSign } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { cn, formatRate, type RateType } from "@/lib/utils";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
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

  const websiteButton = profile.websiteUrl ? (
    <a
      href={profile.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Apri il sito web"
      className={cn(
        "pressable inline-flex shrink-0 items-center justify-center rounded-2xl w-12 h-12 md:w-14 md:h-14 border border-viola-100 bg-white shadow-sm hover:bg-viola-50 transition-colors"
      )}
    >
      <ExternalLink size={22} className="text-viola-600" />
    </a>
  ) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-6 md:gap-12 items-start mb-10 md:mb-16">
        <div className="relative group shrink-0">
          <div className="w-28 h-28 md:w-56 md:h-56 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-viola-100 overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 md:group-hover:scale-[1.02]">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={companyName}
                fill
                sizes="(min-width: 768px) 224px, 112px"
                loading="eager"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-viola-50">
                <Building2 className="w-10 h-10 md:w-16 md:h-16 text-viola-200" />
              </div>
            )}
          </div>
          <div className="absolute -inset-4 bg-blu-500/5 blur-3xl rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        <div className="flex-1 min-w-0 w-full space-y-5 md:space-y-6">
          <div>
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blu-50 text-blu-700 text-[11px] font-black uppercase tracking-widest mb-4">
              <Briefcase size={10} fill="currentColor" /> Azienda Verificata
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-viola-950 leading-[1.05] md:leading-tight tracking-tight wrap-break-word">
              {companyName}
            </h2>
            <p className="text-xl md:text-2xl text-viola-500 font-medium mt-1 md:mt-2 font-display">
              {profile.industry || "Settore Tecnologico"}
            </p>
            <div className="flex items-center gap-3 mt-3 md:mt-4">
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-900">{profile.averageRating || "0.0"}</span>
              </div>
              <span className="text-sm font-bold text-viola-500">({profile.reviewCount || 0} feedback)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-6 text-viola-600 font-bold text-sm md:uppercase md:tracking-wider">
            <div className="flex items-center gap-2 h-9 md:h-auto px-3 md:px-0 rounded-full bg-viola-50 md:bg-transparent border border-viola-100 md:border-0">
              <MapPin size={16} className="text-blu-500 shrink-0" />
              {profile.city || "Sede in Italia"}
            </div>
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 h-9 md:h-auto px-3 md:px-0 rounded-full bg-viola-50 md:bg-transparent border border-viola-100 md:border-0 hover:text-blu-600 transition-colors"
              >
                <Globe size={16} className="text-blu-500 shrink-0" />
                Sito Web
              </a>
            )}
          </div>

          {/* Inline actions from md up; phones get the sticky bar below */}
          <div className="hidden md:flex gap-4 pt-4">
            <Button className="pressable rounded-2xl px-10 h-14 text-lg font-black bg-blu-600 hover:bg-blu-700 text-white transition-colors shadow-xl shadow-blu-100">
              Invia Candidatura
            </Button>
            {websiteButton}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid md:grid-cols-3 gap-10 md:gap-12 border-t border-viola-100 pt-8 md:pt-12">
        <div className="md:col-span-2 space-y-10 md:space-y-12 min-w-0">
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-viola-500">Chi Siamo</h3>
            <p className="text-base md:text-xl text-viola-700 leading-relaxed font-medium">
              {profile.description || "Questa azienda non ha ancora inserito una descrizione ufficiale."}
            </p>
          </div>

          <div className="space-y-5 md:space-y-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-viola-500">Ricerche Attive</h3>
              <Badge variant="secondary" className="h-auto py-1 bg-blu-50 text-blu-700 border-none font-black text-[11px]">
                {jobs.length} POSIZIONI APERTE
              </Badge>
            </div>

            <div className="grid gap-3 md:gap-4">
              {jobs.length > 0 ? jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="pressable group block">
                  <div className="p-5 md:p-6 bg-white border border-viola-100 rounded-3xl shadow-sm hover:shadow-premium transition-shadow duration-300 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-base md:text-lg font-black text-viola-950 group-hover:text-blu-600 transition-colors wrap-break-word">{job.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-viola-500 uppercase tracking-wider md:tracking-widest">
                        <span className="flex items-center gap-1 min-w-0"><MapPin size={12} className="shrink-0" /> <span className="truncate">{job.location || "Remoto"}</span></span>
                        <span className="flex items-center gap-1 whitespace-nowrap"><DollarSign size={12} className="shrink-0" /> Fino a {formatRate(job.rateType, job.budgetMaxEur)}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-viola-50 flex items-center justify-center text-viola-500 group-hover:bg-blu-50 group-hover:text-blu-600 transition-colors">
                      <Briefcase size={18} />
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="p-8 md:p-12 bg-viola-50 rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-viola-200 text-center">
                  <p className="text-viola-500 font-bold italic">Nessuna ricerca attiva al momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10 md:space-y-12">
          <div className="bg-viola-50 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-viola-100 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blu-700 mb-5 md:mb-8 flex items-center gap-2">
              <Building2 size={12} fill="currentColor" /> Info Sede
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-5 md:gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-viola-500 uppercase tracking-widest">Città</p>
                <p className="font-bold text-viola-800">{profile.city || "Sede Centrale"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-viola-500 uppercase tracking-widest">Industria</p>
                <p className="font-bold text-viola-800">{profile.industry || "Non specificato"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-viola-500 uppercase tracking-widest">Social Score</p>
                <div className="flex items-center gap-1 text-amber-600 font-black">
                  <Star size={14} fill="currentColor" /> {profile.averageRating}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-12 md:mt-24 border-t border-viola-100 pt-10 md:pt-16 pb-8 md:pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 mb-8 md:mb-12">
          <div className="space-y-3 min-w-0">
            <h3 className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] text-viola-500 md:text-left">Feedback Candidati</h3>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-viola-950 tracking-tight wrap-break-word">Recensioni per {companyName}</h2>
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
            <p className="text-[11px] font-black uppercase tracking-widest text-viola-500">Media su {profile.reviewCount || 0} feedback</p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                authorName={review.author?.name ?? "Candidato Helllo"}
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
            <h4 className="text-2xl font-display font-bold text-viola-950 mb-3 tracking-tight">In attesa dei primi feedback</h4>
            <p className="text-viola-500 font-medium max-w-sm mx-auto leading-relaxed">
              Nessun candidato ha ancora lasciato una recensione per questa azienda. Le opinioni certificate appariranno qui.
            </p>
          </div>
        )}
      </section>

      {/* Phones: primary action in thumb reach, above the tab bar */}
      <BottomActionBar variant="floating" desktop="hidden">
        <div className="flex items-center gap-2 rounded-[1.25rem] bg-white/90 backdrop-blur-xl border border-viola-100 p-2 shadow-premium">
          <Button className="pressable flex-1 min-w-0 rounded-2xl h-12 text-base font-black bg-blu-600 hover:bg-blu-700 text-white transition-colors">
            Invia Candidatura
          </Button>
          {websiteButton}
        </div>
      </BottomActionBar>
    </div>
  );
}
