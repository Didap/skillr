"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Calendar, Mail, ChevronRight, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMatches } from "@/app/actions/matches";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { MyApplications } from "@/components/matches/MyApplications";
import { PageHeader } from "@/components/layout/PageHeader";

interface MatchSummary {
  id: string;
  matchedAt: Date | string | null;
  targetName: string;
  targetTitle: string | null;
  targetImage: string | null;
  targetRating: string;
  targetReviewCount: number;
  status: string;
  proposedSlotCount: number;
  scheduledAt: Date | string | null;
  hasReviewed: boolean;
}

type CallTone = "action" | "waiting" | "scheduled" | "done";

// What happens next on the call, from the viewer's side.
// The company proposes slots, the professional picks one, then both review after the call.
function getCallStatus(match: MatchSummary, role: string | undefined, now: Date): { label: string; tone: CallTone } {
  const isCompany = role === "company";

  if (match.scheduledAt) {
    const when = new Date(match.scheduledAt);
    if (when > now) {
      const date = when.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
      const time = when.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      return { label: `Call il ${date} alle ${time}`, tone: "scheduled" };
    }
    return match.hasReviewed
      ? { label: "Completato", tone: "done" }
      : { label: "Lascia feedback", tone: "action" };
  }

  if (match.proposedSlotCount === 0) {
    return isCompany
      ? { label: "Proponi gli orari", tone: "action" }
      : { label: "In attesa degli orari", tone: "waiting" };
  }

  return isCompany
    ? { label: "In attesa di conferma", tone: "waiting" }
    : { label: "Scegli l'orario", tone: "action" };
}

const TONE_CLASSES: Record<CallTone, string> = {
  action: "bg-emerald-600 text-white border-emerald-600",
  waiting: "bg-slate-50 text-slate-500 border-slate-200",
  scheduled: "bg-emerald-50 text-emerald-700 border-emerald-100",
  done: "bg-slate-50 text-slate-500 border-slate-100",
};

// First-load stagger: a short cascade, capped so the last row is in by ~200ms.
const STAGGER_STEP = 0.04;
const STAGGER_MAX = 0.2;

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? undefined;
  const router = useRouter();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadMatches() {
      if (status === "authenticated") {
        const res = await getMatches();
        if (res.success) {
           setMatches(res.data as MatchSummary[] || []);
        }
        setLoading(false);
      }
    }
    loadMatches();
  }, [status]);

  const now = new Date();
  const filteredMatches = matches.filter(m =>
    m.targetName.toLowerCase().includes(search.toLowerCase()) ||
    m.targetTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = status === "loading" || loading;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <PageHeader
        title="I tuoi match"
        subtitle="L'inizio di qualcosa di grande"
        actions={
          !isLoading && (
            <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 tabular-nums">
              {matches.length}
              <span className="hidden md:inline">&nbsp;match</span>
              &nbsp;attivi
            </span>
          )
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-tabbar">
        <main className="max-w-4xl w-full mx-auto px-4 py-5 md:p-12">
          {/* Search */}
          <div className="mb-5 md:mb-10 relative group">
            <Search
              aria-hidden="true"
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
              size={20}
            />
            <Input
              type="search"
              aria-label="Cerca tra i match"
              placeholder="Cerca per nome o ruolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 md:pl-16 pr-4 md:pr-6 rounded-2xl h-12 md:h-16 bg-white border-slate-100 shadow-card md:shadow-premium focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-base md:text-lg"
            />
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:gap-4" aria-busy="true" aria-label="Caricamento dei match">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 md:p-6 rounded-3xl md:rounded-[2rem] bg-white border border-slate-50 shadow-card">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-slate-100 animate-pulse motion-reduce:animate-none shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/5 rounded-full bg-slate-100 animate-pulse motion-reduce:animate-none" />
                    <div className="h-3 w-3/5 rounded-full bg-slate-100 animate-pulse motion-reduce:animate-none" />
                    <div className="h-5 w-28 rounded-lg bg-slate-100 animate-pulse motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="grid gap-3 md:gap-4">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match, idx) => {
                  const callStatus = getCallStatus(match, role, now);
                  const rating = parseFloat(match.targetRating);
                  return (
                    <motion.li
                      key={match.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: duration.state,
                        ease: ease.out,
                        delay: Math.min(idx * STAGGER_STEP, STAGGER_MAX),
                      }}
                    >
                      <Link
                        href={`/matches/${match.id}`}
                        className="pressable group flex items-center gap-3 md:gap-6 min-h-16 p-4 md:p-6 rounded-3xl md:rounded-[2rem] bg-white border border-slate-50 shadow-card hover:shadow-premium hover:border-emerald-100 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 ring-2 md:ring-4 ring-slate-50">
                          {match.targetImage ? (
                            <Image src={match.targetImage} alt="" width={80} height={80} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-display text-2xl md:text-3xl italic">
                              {match.targetName[0]}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-base md:text-xl font-bold text-slate-950 truncate group-hover:text-emerald-700 transition-colors">
                              {match.targetName}
                            </h3>
                            {rating > 0 && (
                              <span className="inline-flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-100 text-[11px] font-bold tabular-nums">
                                <Star size={10} fill="currentColor" aria-hidden="true" />
                                {match.targetRating}
                              </span>
                            )}
                          </div>
                          {match.targetTitle && (
                            <p className="text-sm text-emerald-700 font-semibold truncate">{match.targetTitle}</p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
                            <span
                              className={cn(
                                "inline-flex max-w-full items-center rounded-lg border px-2 py-1 text-xs font-bold leading-none",
                                TONE_CLASSES[callStatus.tone]
                              )}
                            >
                              <span className="truncate">{callStatus.label}</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                              <Calendar size={12} className="text-emerald-500" aria-hidden="true" />
                              Match del {match.matchedAt ? new Date(match.matchedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—'}
                              {match.targetReviewCount > 0 && (
                                <>
                                  <span className="w-1 h-1 bg-slate-200 rounded-full" aria-hidden="true" />
                                  {match.targetReviewCount} recensioni
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full md:rounded-xl flex items-center justify-center text-slate-400 md:bg-slate-50 group-hover:text-emerald-700 transition-colors shrink-0">
                          <ChevronRight size={20} aria-hidden="true" />
                        </div>
                      </Link>
                    </motion.li>
                  );
                })
              ) : matches.length > 0 ? (
                <li className="text-center py-12 px-6 rounded-3xl border border-dashed border-slate-200">
                  <p className="font-semibold text-slate-500">Nessun match per &ldquo;{search}&rdquo;</p>
                  <p className="text-sm text-slate-400 mt-1">Prova con un altro nome o ruolo.</p>
                </li>
              ) : (
                <li className="text-center py-14 md:py-24 px-6 bg-white rounded-3xl md:rounded-[3rem] border border-dashed border-slate-200">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-5 md:mb-6">
                    <Star size={32} aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-display italic text-slate-500">Ancora nessun match</h3>
                  <p className="text-slate-500 font-medium mt-2">Torna allo swipe per trovare il tuo prossimo collaboratore.</p>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants(),
                      "pressable mt-6 md:mt-8 rounded-full h-12 px-8 text-base bg-slate-950 hover:bg-emerald-800 transition-colors"
                    )}
                  >
                    Inizia ora
                  </Link>
                </li>
              )}
            </ul>
          )}

          {/* How matches work: a compact note after the list, so the list stays first */}
          {!isLoading && (
            <aside className="mt-6 md:mt-10 flex items-start gap-3 p-4 md:p-6 rounded-2xl md:rounded-3xl bg-emerald-50/70 border border-emerald-100">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <Mail size={18} aria-hidden="true" />
              </div>
              <p className="text-sm text-emerald-900/80 font-medium leading-relaxed">
                <span className="font-bold text-emerald-900">Zero chat, massima efficienza.</span>{" "}
                Su Skillr non si perde tempo a chattare. Entra nel match, guarda gli slot proposti e fissa la tua videochiamata conoscitiva.
              </p>
            </aside>
          )}

          {role === "professional" && <MyApplications />}
        </main>
      </div>
    </div>
  );
}
