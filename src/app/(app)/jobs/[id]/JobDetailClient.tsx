"use client";

import { useState } from "react";
import {
  Briefcase,
  MapPin,
  Laptop,
  Users,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Star,
  Zap,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { acceptApplicant, rejectApplicant } from "@/app/actions/applications";
import { toast } from "sonner";
import { skillLabel } from "@/lib/skill-slugs";
import { PageHeader } from "@/components/layout/PageHeader";
import { duration, ease, haptic, spring } from "@/lib/motion";
import { cn, formatRate, type RateType } from "@/lib/utils";

interface Applicant {
  id: string;
  status: "pending" | "accepted" | "rejected" | "passed" | null;
  professional: {
    id: string;
    name: string | null;
    image: string | null;
    professionalProfile: {
      firstName: string | null;
      lastName: string | null;
      title: string | null;
      photoUrl: string | null;
      city: string | null;
      rateType: RateType | null;
      rateAmountEur: number | null;
      topSkills: string[] | null;
      averageRating: string | null;
      reviewCount: number | null;
      bioShort: string | null;
    } | null;
  };
}

interface Job {
  id: string;
  title: string;
  location: string | null;
  remoteOk: boolean | null;
  budgetMinEur: number | null;
  budgetMaxEur: number | null;
  rateType: RateType | null;
  skills: string[] | null;
  description: string | null;
}

type Decision = "accept" | "reject";

// A pending card leaves towards the side of the decision: right for accepted, left for rejected
const pendingCardVariants = {
  exit: (decision: Decision | null) => ({
    opacity: 0,
    x: decision === "reject" ? -48 : 48,
    scale: 0.98,
    transition: { duration: duration.state, ease: ease.in },
  }),
};

function applicantName(app: Applicant) {
  const profile = app.professional.professionalProfile;
  return profile?.firstName ? `${profile.firstName} ${profile.lastName}` : app.professional.name || "Professionista";
}

function Avatar({ app, name, className, size }: { app: Applicant; name: string; className?: string; size: number }) {
  const src = app.professional.professionalProfile?.photoUrl || app.professional.image;
  return (
    <div className={cn("shrink-0 overflow-hidden bg-slate-50 border-2 border-white shadow-sm", className)}>
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="w-full h-full object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300 font-display italic text-3xl md:text-5xl">
          {name[0]}
        </div>
      )}
    </div>
  );
}

export function JobDetailClient({ job, initialApplicants, skillLabels }: { job: Job, initialApplicants: Applicant[], skillLabels: Record<string, string> }) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const labelBySlug = new Map(Object.entries(skillLabels));
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<Decision | null>(null);

  const handleAccept = async (appId: string) => {
    setProcessingId(appId);
    const res = await acceptApplicant(appId);
    if (res.success) {
      haptic([10, 40, 10]);
      toast.success("Match creato!", {
        description: "Il candidato è stato accettato. Ora puoi fissare un colloquio.",
        icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      });
      setLastDecision("accept");
      // Update local state instead of filtering out
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a));
    } else {
      toast.error(res.error || "Errore durante l'accettazione");
    }
    setProcessingId(null);
  };

  const handleReject = async (appId: string) => {
    setProcessingId(appId);
    const res = await rejectApplicant(appId);
    if (res.success) {
      haptic();
      toast.success("Candidato rimosso", {
        description: "La candidatura è stata rifiutata.",
        icon: <XCircle size={16} className="text-red-500" />,
      });
      setLastDecision("reject");
      setApplicants(prev => prev.filter(a => a.id !== appId));
    } else {
      toast.error(res.error || "Errore durante il rifiuto");
    }
    setProcessingId(null);
  };

  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const acceptedApplicants = applicants.filter(a => a.status === 'accepted');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFDFC]">
      <PageHeader
        title={job.title}
        subtitle="Gestione candidati"
        backHref="/jobs"
        actions={
          <span className="hidden md:inline-flex items-center gap-2 h-9 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-500 tabular-nums">
            {pendingApplicants.length} {pendingApplicants.length === 1 ? "candidatura" : "candidature"} in attesa
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain pb-tabbar">
        <main className="max-w-6xl w-full mx-auto px-4 pt-5 pb-8 md:p-8 lg:p-12">
          {/* Job summary */}
          <section
            aria-label="Riepilogo ricerca"
            className="mb-8 md:mb-12 p-5 md:p-8 bg-slate-950 rounded-3xl md:rounded-[2.5rem] text-white shadow-premium relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative flex flex-col md:flex-row justify-between gap-5 md:gap-8">
              <div className="space-y-3 md:space-y-4 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400">
                    <Briefcase className="size-5 md:size-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display italic leading-tight line-clamp-2 break-words">{job.title}</h2>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-slate-300 text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-emerald-500 shrink-0" />
                    <span>{job.location || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Laptop size={16} className="text-emerald-500 shrink-0" />
                    <span>{job.remoteOk ? "Remote OK" : "In sede"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <Zap size={16} className="text-emerald-500 shrink-0" />
                    <span>{formatRate(job.rateType, job.budgetMinEur, job.budgetMaxEur)}</span>
                  </div>
                </div>

                {job.description && (
                  <p className="text-slate-300 text-sm leading-relaxed max-w-2xl italic line-clamp-3 md:line-clamp-none">
                    &quot;{job.description}&quot;
                  </p>
                )}
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 items-start md:justify-end md:max-w-sm">
                  {job.skills.map((s: string) => (
                    <span key={s} className="inline-flex items-center h-7 px-3 rounded-lg bg-white/5 border border-white/10 text-white/75 text-[11px] font-bold uppercase tracking-wider">
                      {skillLabel(s, labelBySlug)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Pending applicants */}
          <section aria-labelledby="pending-heading" className="space-y-4 md:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Users size={20} />
              </div>
              <h3 id="pending-heading" className="text-lg md:text-xl font-bold text-slate-950">Candidati da valutare</h3>
              <span className="ml-auto md:ml-0 inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold tabular-nums">
                {pendingApplicants.length}
              </span>
            </div>

            <div className="relative grid gap-4 md:gap-6">
              <AnimatePresence mode="popLayout" custom={lastDecision}>
                {pendingApplicants.length > 0 ? (
                  pendingApplicants.map((app, idx) => {
                    const prof = app.professional;
                    const profile = prof.professionalProfile;
                    const name = applicantName(app);
                    const isProcessing = processingId === app.id;

                    return (
                      <motion.article
                        key={app.id}
                        layout
                        custom={lastDecision}
                        variants={pendingCardVariants}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          x: 0,
                          scale: 1,
                          transition: { duration: duration.view, ease: ease.out, delay: Math.min(idx, 4) * 0.05 },
                        }}
                        exit="exit"
                        transition={spring.snappy}
                        className="rounded-3xl md:rounded-[2rem] bg-white shadow-card md:hover:shadow-premium transition-shadow duration-500 group overflow-hidden"
                      >
                        <div className="p-5 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                          <div className="flex items-start md:items-center gap-4 md:gap-8 flex-1 min-w-0">
                            {/* Profile Image */}
                            <div className="relative shrink-0">
                              <Avatar
                                app={app}
                                name={name}
                                size={128}
                                className="w-16 h-16 md:w-32 md:h-32 rounded-2xl md:rounded-[1.5rem] ring-4 ring-slate-50 md:transition-transform md:group-hover:scale-105 md:duration-500"
                              />
                              {profile?.averageRating && parseFloat(profile.averageRating) > 0 && (
                                <div className="absolute -bottom-2 -right-2 bg-amber-50 text-amber-600 px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl border border-amber-100 shadow-sm flex items-center gap-1">
                                  <Star size={11} fill="currentColor" />
                                  <span className="text-[11px] md:text-xs font-black tabular-nums">{profile.averageRating}</span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-2.5 md:space-y-4">
                              <div className="min-w-0">
                                <h4 className="text-lg md:text-2xl font-bold text-slate-950 leading-tight truncate md:group-hover:text-emerald-700 transition-colors">{name}</h4>
                                <p className="text-emerald-600 font-semibold italic text-sm md:text-base truncate">{profile?.title || "Professionista IT"}</p>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={13} className="text-emerald-500 shrink-0" />
                                  {profile?.city || "Remote"}
                                </span>
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Zap size={13} className="text-emerald-500 shrink-0" />
                                  {formatRate(profile?.rateType, profile?.rateAmountEur)}
                                </span>
                              </div>

                              {profile?.topSkills && profile.topSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                  {profile.topSkills.slice(0, 4).map(s => (
                                    <span key={s} className="inline-flex items-center h-7 px-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold">
                                      {skillLabel(s, labelBySlug)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 md:flex md:flex-col gap-2.5 md:gap-3 md:w-48 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleAccept(app.id)}
                              disabled={!!processingId}
                              className="pressable h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                            >
                              {isProcessing ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 size={18} /> Accetta
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(app.id)}
                              disabled={!!processingId}
                              className="pressable h-12 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                            >
                              <XCircle size={18} /> Rifiuta
                            </button>
                            <Link
                              href={`/profile/${prof.id}`}
                              className="pressable col-span-2 h-11 rounded-2xl text-sm text-slate-500 hover:text-slate-950 hover:bg-slate-50 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                            >
                              Vedi profilo <ChevronRight size={16} />
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: duration.state, delay: duration.state } }}
                    exit={{ opacity: 0, transition: { duration: duration.feedback } }}
                    className="text-center py-14 md:py-24 px-6 bg-white rounded-3xl md:rounded-[3rem] border border-dashed border-slate-200"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-5 md:mb-6">
                      <Users className="size-8 md:size-10" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-display italic text-slate-500">Nessun candidato in attesa</h3>
                    <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Le nuove candidature appariranno qui appena i professionisti metteranno like.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Accepted applicants */}
          <AnimatePresence initial={false}>
            {acceptedApplicants.length > 0 && (
              <motion.section
                key="accepted"
                aria-labelledby="accepted-heading"
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                exit={{ opacity: 0, transition: { duration: duration.feedback } }}
                className="space-y-4 md:space-y-8 mt-10 md:mt-16 pt-8 md:pt-16 border-t border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 id="accepted-heading" className="text-lg md:text-xl font-bold text-slate-950">Candidati accettati</h3>
                  <span className="ml-auto md:ml-0 inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold tabular-nums">
                    {acceptedApplicants.length}
                  </span>
                </div>

                <div className="relative grid gap-4 md:gap-6">
                  <AnimatePresence initial={false} mode="popLayout">
                    {acceptedApplicants.map((app) => {
                      const prof = app.professional;
                      const profile = prof.professionalProfile;
                      const name = applicantName(app);

                      return (
                        <motion.article
                          key={app.id}
                          layout
                          initial={{ opacity: 0, y: -16, scale: 0.98 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: { duration: duration.view, ease: ease.out, delay: duration.feedback },
                          }}
                          transition={spring.snappy}
                          className="rounded-3xl md:rounded-[2rem] bg-emerald-50/40 border border-emerald-100/60 shadow-card group overflow-hidden"
                        >
                          <div className="p-5 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                            <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                              <Avatar
                                app={app}
                                name={name}
                                size={96}
                                className="w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-[1.2rem] bg-white ring-4 ring-emerald-50/50"
                              />
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <h4 className="text-lg md:text-xl font-bold text-slate-950 leading-tight truncate">{name}</h4>
                                <p className="text-emerald-600 font-semibold italic text-sm truncate">{profile?.title || "Professionista IT"}</p>
                                <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                                  <MapPin size={13} className="text-emerald-500 shrink-0" />
                                  {profile?.city || "Remote"}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-[1fr_auto] md:flex md:items-center gap-2.5 md:gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-emerald-100/60">
                              <Link
                                href="/matches"
                                className="pressable h-12 px-5 md:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center justify-center gap-2 transition-colors"
                              >
                                Vai ai match <ChevronRight size={18} />
                              </Link>
                              <Link
                                href={`/profile/${prof.id}`}
                                className="pressable h-12 px-5 rounded-2xl border border-emerald-100 bg-white text-slate-600 hover:text-slate-950 font-bold inline-flex items-center justify-center transition-colors"
                              >
                                Profilo
                              </Link>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
