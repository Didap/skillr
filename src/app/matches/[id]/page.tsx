import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, ExternalLink, Zap, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMatchDetail } from "@/app/actions/matches";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BookingSection } from "@/components/matches/BookingSection";

interface ProposedSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAccepted: boolean;
}

interface MatchDetail {
  id: string;
  targetId: string;
  targetName: string;
  targetTitle: string | null;
  targetImage: string | null;
  targetEmail: string | null;
  targetBio: string | null;
  targetSkills: string[] | null;
  targetRate: string | null;
  proposedSlots: ProposedSlot[];
  scheduledAt: Date | null;
  meetingLink: string | null;
  hasReviewed: boolean;
  // Spread from the match row by getMatchDetail, used for the location badge.
  professional?: { professionalProfile?: { city: string | null; remoteOk: boolean | null } | null } | null;
  company?: { companyProfile?: { city: string | null } | null } | null;
  job?: { location: string | null; remoteOk: boolean | null } | null;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const res = await getMatchDetail(id);
  
  if (res.error || !res.data) {
    notFound();
  }

  const match = res.data as MatchDetail;
  const role = session.user.role as "professional" | "company";

  // Companies see where the professional works from; professionals see the job's location.
  const location = role === 'company'
    ? { city: match.professional?.professionalProfile?.city, remoteOk: match.professional?.professionalProfile?.remoteOk }
    : { city: match.job?.location || match.company?.companyProfile?.city, remoteOk: match.job?.remoteOk };
  const locationLabel = [location.city, location.remoteOk ? 'Remoto OK' : null].filter(Boolean).join(' · ');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <PageHeader
        backHref="/matches"
        title={match.targetName}
        subtitle="Gestisci la tua intervista"
        actions={
          <>
            <Link
              href={`/profile/${match.targetId}`}
              aria-label="Vedi profilo"
              className="md:hidden pressable w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
            >
              <UserRound size={21} />
            </Link>
            <Link
              href={`/profile/${match.targetId}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hidden md:inline-flex rounded-2xl h-12 px-5 border-border-strong bg-white hover:bg-surface-warm transition-colors font-bold gap-2 shadow-sm"
              )}
            >
              Vedi Profilo <ExternalLink size={16} />
            </Link>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-tabbar">
        <main className="max-w-5xl w-full mx-auto px-4 py-5 md:p-8 lg:p-12">
          {/* Phones: two stacked blocks (profile card, then scheduling). Desktop: one card. */}
          <div className="md:bg-white md:rounded-[2.5rem] md:border md:border-border-subtle md:shadow-premium md:overflow-hidden">
            {/* Profile summary */}
            <section
              aria-label={`Profilo di ${match.targetName}`}
              className="relative bg-white rounded-3xl border border-border-subtle shadow-card md:rounded-none md:border-0 md:shadow-none"
            >
              <div className="absolute inset-0 hidden md:block bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

              <div className="relative p-5 md:p-12">
                <div className="flex flex-row gap-4 md:gap-12 items-center">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 md:w-40 md:h-40 rounded-3xl md:rounded-[2.5rem] bg-surface-warm border border-border-subtle shadow-sm overflow-hidden flex items-center justify-center">
                      {match.targetImage ? (
                        <Image src={match.targetImage} alt={match.targetName} width={160} height={160} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-display text-4xl md:text-6xl italic">
                          {match.targetName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-emerald-500 w-6 h-6 md:w-8 md:h-8 rounded-full border-[3px] md:border-4 border-white flex items-center justify-center shadow-md">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse motion-reduce:animate-none" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                    <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.2em] mb-2">
                      <Zap size={10} fill="currentColor" /> Match Confermato
                    </div>
                    <h2 className="text-2xl md:text-5xl font-display italic text-text-primary tracking-tight leading-tight break-words line-clamp-2">
                      {match.targetName}
                    </h2>
                    {match.targetTitle && (
                      <p className="text-base md:text-2xl text-primary font-medium opacity-90 italic leading-snug break-words line-clamp-2">
                        {match.targetTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 md:mt-8 md:pl-52 space-y-5 md:space-y-6">
                  {match.targetBio && (
                    <p className="text-[15px] md:text-base text-text-secondary leading-relaxed max-w-2xl break-words">
                      {match.targetBio}
                    </p>
                  )}

                  {match.targetSkills && match.targetSkills.length > 0 && (
                    <ul className="flex flex-wrap gap-2" aria-label="Competenze">
                      {match.targetSkills.map((skill: string) => (
                        <li key={skill} className="max-w-full px-3 py-1.5 rounded-lg bg-surface-warm text-text-secondary text-xs font-bold border border-border-subtle break-words">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}

                  {(locationLabel || match.targetRate || match.targetEmail) && (
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {locationLabel && (
                        <div className="flex items-center gap-2 max-w-full bg-surface-warm/50 px-3 md:px-4 py-2 rounded-2xl text-sm font-semibold text-text-secondary border border-border-subtle">
                          <MapPin size={16} className="text-primary shrink-0" />
                          <span className="min-w-0 break-words">{locationLabel}</span>
                        </div>
                      )}
                      {match.targetRate && (
                        <div className="flex items-center gap-2 max-w-full bg-emerald-50 text-emerald-700 px-3 md:px-4 py-2 rounded-2xl text-sm font-bold border border-emerald-100 shadow-sm">
                          <Zap size={16} fill="currentColor" className="text-emerald-500 shrink-0" />
                          <span className="min-w-0 break-words">{match.targetRate}</span>
                        </div>
                      )}
                      {match.targetEmail && (
                        <div className="flex items-center gap-2 max-w-full bg-primary/5 text-primary px-3 md:px-4 py-2 rounded-2xl text-sm font-bold border border-primary/10">
                          <Mail size={16} className="shrink-0" />
                          <span className="min-w-0 break-all">{match.targetEmail}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Separator with badge (desktop) */}
            <div className="relative hidden md:block" aria-hidden="true">
              <div className="absolute inset-0 flex items-center px-12">
                <div className="w-full border-t border-border-subtle/50" />
              </div>
              <div className="relative flex justify-center">
                <div className="bg-white px-6">
                  <div className="px-4 py-1.5 rounded-full bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.2em]">
                    Scheduling & Feedback
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling & feedback */}
            <section aria-label="Pianificazione e feedback" className="mt-6 md:mt-0 md:bg-white md:pb-8">
              <BookingSection
                matchId={match.id}
                role={role}
                proposedSlots={match.proposedSlots.map((s: ProposedSlot) => ({
                  id: s.id,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  isAccepted: s.isAccepted
                }))}
                scheduledAt={match.scheduledAt}
                meetingLink={match.meetingLink}
                hasReviewed={match.hasReviewed}
                targetName={match.targetName}
              />
            </section>
          </div>

          <footer className="hidden md:block text-center py-12">
            <p className="text-xs font-bold text-text-muted uppercase tracking-[0.3em]">
              Skillr © 2026 — Zero Messaggi, Solo Match.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
