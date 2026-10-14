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
  Euro,
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
import { buttonVariants } from "@/components/ui/button";

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
    <div className={cn("shrink-0 overflow-hidden bg-crema", className)}>
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="w-full h-full object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-viola font-display font-bold text-2xl md:text-4xl" aria-hidden="true">
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
        icon: <CheckCircle2 size={16} className="text-rosso-500" />,
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
        icon: <XCircle size={16} className="text-rosso-500" />,
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <PageHeader
        title={job.title}
        subtitle="Gestione candidati"
        backHref="/jobs"
        actions={
          <span className="hidden md:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-crema text-chip text-viola tabular-nums">
            {pendingApplicants.length} {pendingApplicants.length === 1 ? "candidatura" : "candidature"} in attesa
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain pb-tabbar">
        <main className="max-w-6xl w-full mx-auto px-4 pt-5 pb-8 md:p-8 lg:p-12">
          {/* Job summary */}
          <section
            aria-label="Riepilogo ricerca"
            className="mb-8 md:mb-12 p-6 md:p-8 bg-viola rounded-card text-white"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8">
              <div className="space-y-4 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-full bg-rosa flex items-center justify-center text-viola" aria-hidden="true">
                    <Briefcase className="size-5 md:size-6" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-2xl md:text-title font-bold leading-tight line-clamp-2 break-words">{job.title}</h2>
                </div>

                {/* Budget first: transparency is a core value */}
                <div>
                  <p className="text-label text-rosa">Budget</p>
                  <p className="text-2xl md:text-title font-bold tabular-nums">
                    {formatRate(job.rateType, job.budgetMinEur, job.budgetMaxEur)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-crema text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} strokeWidth={1.75} className="text-rosa shrink-0" aria-hidden="true" />
                    <span>{job.location || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Laptop size={16} strokeWidth={1.75} className="text-rosa shrink-0" aria-hidden="true" />
                    <span>{job.remoteOk ? "Remote OK" : "In sede"}</span>
                  </div>
                </div>

                {job.description && (
                  <div className="space-y-1 max-w-2xl">
                    <p className="text-label text-rosa">Descrizione</p>
                    <p className="font-prompt text-lg md:text-xl font-medium leading-7 text-white line-clamp-3 md:line-clamp-none wrap-break-word">
                      {job.description}
                    </p>
                  </div>
                )}
              </div>

              {job.skills && job.skills.length > 0 && (
                <ul aria-label="Skill richieste" className="flex flex-wrap gap-2 items-start content-start md:justify-end md:max-w-sm">
                  {job.skills.map((s: string) => (
                    <li key={s} className="inline-flex items-center h-8 px-4 rounded-full bg-rosa text-viola text-chip">
                      {skillLabel(s, labelBySlug)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Pending applicants */}
          <section aria-labelledby="pending-heading" className="space-y-4 md:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-rosa flex items-center justify-center text-viola shrink-0" aria-hidden="true">
                <Users size={20} strokeWidth={1.75} />
              </div>
              <h3 id="pending-heading" className="text-xl md:text-title font-bold text-viola">Candidati da valutare</h3>
              <span className="ml-auto md:ml-0 inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-crema text-viola text-sm font-bold tabular-nums">
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
                        className="rounded-card bg-white ring-1 ring-viola/15 group overflow-hidden"
                      >
                        <div className="p-5 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                          <div className="flex items-start md:items-center gap-4 md:gap-8 flex-1 min-w-0">
                            {/* Profile Image */}
                            <div className="relative shrink-0">
                              <Avatar
                                app={app}
                                name={name}
                                size={128}
                                className="w-16 h-16 md:w-28 md:h-28 rounded-full"
                              />
                              {profile?.averageRating && parseFloat(profile.averageRating) > 0 && (
                                <div className="absolute -bottom-1 -right-1 bg-white text-viola px-2 py-0.5 rounded-full ring-1 ring-viola/15 flex items-center gap-1">
                                  <Star size={11} fill="currentColor" className="text-rosso" aria-hidden="true" />
                                  <span className="text-xs font-bold tabular-nums"><span className="sr-only">Valutazione </span>{profile.averageRating}</span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-2.5 md:space-y-4">
                              <div className="min-w-0">
                                <h4 className="text-xl md:text-title font-bold text-viola truncate">{name}</h4>
                                <p className="text-body font-medium text-viola-500 truncate">{profile?.title || "Professionista IT"}</p>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-viola-500">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                                  {profile?.city || "Remote"}
                                </span>
                                <span className="inline-flex items-center gap-1 tabular-nums font-bold text-viola">
                                  <Euro size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                                  <span className="sr-only">Tariffa: </span>
                                  {formatRate(profile?.rateType, profile?.rateAmountEur)}
                                </span>
                              </div>

                              {profile?.topSkills && profile.topSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                  {profile.topSkills.slice(0, 4).map(s => (
                                    <span key={s} className="inline-flex items-center h-8 px-3 rounded-full bg-rosa text-viola text-chip">
                                      {skillLabel(s, labelBySlug)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 md:flex md:flex-col gap-2.5 md:gap-3 md:w-48 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-viola/15">
                            <button
                              type="button"
                              onClick={() => handleAccept(app.id)}
                              disabled={!!processingId}
                              className={cn(buttonVariants(), "h-12 gap-2 text-base disabled:opacity-60")}
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
                              className={cn(buttonVariants({ variant: "outline" }), "h-12 gap-2 text-base font-bold disabled:opacity-60")}
                            >
                              <XCircle size={18} /> Rifiuta
                            </button>
                            <Link
                              href={`/profile/${prof.id}`}
                              className={cn(buttonVariants({ variant: "link" }), "col-span-2 h-11 gap-1.5 text-sm")}
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
                    className="text-center py-14 md:py-20 px-6 bg-crema rounded-card"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-rosa rounded-full flex items-center justify-center text-viola mx-auto mb-5 md:mb-6" aria-hidden="true">
                      <Users className="size-8 md:size-9" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-title text-viola">Nessun candidato in attesa</h3>
                    <p className="text-body text-viola-500 mt-2 max-w-sm mx-auto">Appena un professionista dice helllo a questa ricerca, lo trovi qui.</p>
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
                className="space-y-4 md:space-y-8 mt-10 md:mt-16 pt-8 md:pt-16 border-t border-viola/15"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rosso text-white flex items-center justify-center shrink-0" aria-hidden="true">
                    <CheckCircle2 size={20} strokeWidth={1.75} />
                  </div>
                  <h3 id="accepted-heading" className="text-xl md:text-title font-bold text-viola">Candidati accettati</h3>
                  <span className="ml-auto md:ml-0 inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-rosa text-viola text-sm font-bold tabular-nums">
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
                          className="rounded-card bg-crema group overflow-hidden"
                        >
                          <div className="p-5 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                            <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                              <Avatar
                                app={app}
                                name={name}
                                size={96}
                                className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <h4 className="text-xl font-bold text-viola leading-tight truncate">{name}</h4>
                                <p className="text-body font-medium text-viola-500 truncate">{profile?.title || "Professionista IT"}</p>
                                <p className="inline-flex items-center gap-1 text-sm text-viola-500">
                                  <MapPin size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                                  {profile?.city || "Remote"}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-[1fr_auto] md:flex md:items-center gap-2.5 md:gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-viola/10">
                              <Link
                                href="/matches"
                                className={cn(buttonVariants(), "h-12 px-5 md:px-6 gap-2 text-base")}
                              >
                                Vai ai match <ChevronRight size={18} />
                              </Link>
                              <Link
                                href={`/profile/${prof.id}`}
                                className={cn(buttonVariants({ variant: "outline" }), "h-12 px-5 text-base font-bold")}
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
