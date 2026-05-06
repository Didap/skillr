import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Star, Briefcase, Building2, ExternalLink, DollarSign } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  location: string | null;
  budgetMaxEur: number | null;
  rateType: string | null;
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
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-12 items-start mb-16">
        <div className="relative group shrink-0">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-[1.02] flex items-center justify-center p-6">
            {profile.logoUrl ? (
              <div className="relative w-full h-full">
                <Image 
                  src={profile.logoUrl} 
                  alt={companyName} 
                  fill 
                  className="object-contain"
                />
              </div>
            ) : (
              <Building2 size={64} className="text-slate-200" />
            )}
          </div>
          <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
        
        <div className="flex-1 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">
               <Briefcase size={10} fill="currentColor" /> Azienda Verificata
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-950 leading-tight tracking-tight">
              {companyName}
            </h1>
            <p className="text-2xl text-slate-500 font-medium mt-2 italic font-display">
              {profile.industry || "Settore Tecnologico"}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-amber-900">{profile.averageRating || "0.0"}</span>
              </div>
              <span className="text-sm font-bold text-slate-400">({profile.reviewCount || 0} feedback)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-slate-600 font-bold text-sm uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" />
              {profile.city || "Sede in Italia"}
            </div>
            {profile.websiteUrl && (
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  Sito Web
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button className="rounded-2xl px-10 h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xl shadow-blue-100">
              Invia Candidatura
            </Button>
            {profile.websiteUrl && (
              <a 
                href={profile.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl w-14 h-14 border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-colors"
                )}
              >
                <ExternalLink size={22} className="text-slate-600" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid md:grid-cols-3 gap-12 border-t border-slate-100 pt-12">
        <div className="md:col-span-2 space-y-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chi Siamo</h3>
            <p className="text-xl text-slate-700 leading-relaxed font-medium">
              {profile.description || "Questa azienda non ha ancora inserito una descrizione ufficiale."}
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ricerche Attive</h3>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-black text-[10px]">
                {jobs.length} POSIZIONI APERTE
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {jobs.length > 0 ? jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-premium transition-all duration-300 flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-950 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location || "Remoto"}</span>
                        <span className="flex items-center gap-1"><DollarSign size={12} /> Fino a €{job.budgetMaxEur}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <Briefcase size={18} />
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                  <p className="text-slate-400 font-bold italic">Nessuna ricerca attiva al momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-8 flex items-center gap-2">
              <Building2 size={12} fill="currentColor" /> Info Sede
            </h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Città</p>
                <p className="font-bold text-slate-800">{profile.city || "Sede Centrale"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industria</p>
                <p className="font-bold text-slate-800">{profile.industry || "Non specificato"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Social Score</p>
                <div className="flex items-center gap-1 text-amber-500 font-black">
                  <Star size={14} fill="currentColor" /> {profile.averageRating}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mt-24 border-t border-slate-100 pt-16 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
           <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center md:text-left">Feedback Candidati</h3>
              <h2 className="text-4xl font-display italic font-bold text-slate-950 tracking-tight">Recensioni per {companyName}</h2>
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media su {profile.reviewCount || 0} feedback</p>
           </div>
        </div>

        {reviews.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((review) => (
                <ReviewCard 
                  key={review.id}
                  authorName={review.author?.name ?? "Candidato Skillr"}
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
              <h4 className="text-2xl font-display font-bold text-slate-950 mb-3 tracking-tight">In attesa dei primi feedback</h4>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Nessun candidato ha ancora lasciato una recensione per questa azienda. Le opinioni certificate appariranno qui.
              </p>
           </div>
        )}
      </section>
    </div>
  );
}
