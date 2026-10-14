"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Calendar, MessageCircle, ChevronRight, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMatches } from "@/app/actions/matches";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { MyApplications, type MyApplicationsResult } from "@/components/matches/MyApplications";
import { formatEventDayShort, formatEventTime } from "@/lib/rome-time";
import { PageHeader } from "@/components/layout/PageHeader";
import { LogoMark } from "@/components/brand/LogoMark";
import { useChatRealtime } from "@/components/chat/ChatRealtimeProvider";
import { UnreadBadge } from "@/components/chat/UnreadBadge";
import { formatChatTime, previewText } from "@/lib/chat/format";
import type { ChatSummary } from "@/lib/chat/types";

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
  chat: ChatSummary;
}

type CallTone = "action" | "waiting" | "scheduled" | "done";

// What happens next on the call, from the viewer's side.
// The company proposes slots, the professional picks one, then both review after the call.
function getCallStatus(match: MatchSummary, role: string | undefined, now: Date): { label: string; tone: CallTone } {
  const isCompany = role === "company";

  if (match.scheduledAt) {
    const when = new Date(match.scheduledAt);
    if (when > now) {
      return { label: `Call il ${formatEventDayShort(when)} alle ${formatEventTime(when)}`, tone: "scheduled" };
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

// Status pills: rosso when it's your move (bold white label), rosa once the call is set
const TONE_CLASSES: Record<CallTone, string> = {
  action: "bg-rosso text-white font-bold",
  waiting: "bg-crema text-viola",
  scheduled: "bg-rosa text-viola",
  done: "bg-viola-50 text-viola-500",
};

// First-load stagger: a short cascade, capped so the last row is in by ~200ms.
const STAGGER_STEP = 0.04;
const STAGGER_MAX = 0.2;

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? undefined;
  const router = useRouter();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [applications, setApplications] = useState<MyApplicationsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Only the newest getMatches request may write the list (and none after unmount)
  const latestRequest = useRef(0);
  useEffect(() => {
    // Invalidates in-flight requests on unmount
    return () => {
      latestRequest.current += 1;
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadMatches() {
      if (status === "authenticated") {
        // Matches and (for professionals) applications arrive in one call
        const request = ++latestRequest.current;
        const res = await getMatches();
        if (request === latestRequest.current && res.success) {
           setMatches(res.data);
        }
        if ("applications" in res && res.applications) setApplications(res.applications);
        setLoading(false);
      }
    }
    loadMatches();
  }, [status]);

  // Live inbox: any change to one of your conversations reloads the list (debounced)
  const { onInboxUpdate } = useChatRealtime();
  useEffect(() => {
    if (status !== "authenticated") return;
    let timer: number | undefined;
    const off = onInboxUpdate(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const request = ++latestRequest.current;
        const res = await getMatches();
        if (request === latestRequest.current && res.success) setMatches(res.data);
      }, 400);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [status, onInboxUpdate]);

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
            <span className="inline-flex h-8 items-center rounded-full bg-rosa px-3 text-chip text-viola tabular-nums">
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
          <div className="mb-5 md:mb-8 relative group">
            <Search
              aria-hidden="true"
              strokeWidth={1.75}
              className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 z-10 text-viola-400 group-focus-within:text-viola transition-colors pointer-events-none"
              size={20}
            />
            <Input
              type="search"
              aria-label="Cerca tra i match"
              placeholder="Cerca per nome o ruolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 md:pl-14 pr-4 md:pr-6 rounded-full h-12 md:h-14 text-base"
            />
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:gap-4" aria-busy="true" aria-label="Caricamento dei match">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 md:p-5 rounded-card bg-crema">
                  <div className="size-14 md:size-16 rounded-full bg-viola-100 animate-pulse motion-reduce:animate-none shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/5 rounded-full bg-viola-100 animate-pulse motion-reduce:animate-none" />
                    <div className="h-3 w-3/5 rounded-full bg-viola-100 animate-pulse motion-reduce:animate-none" />
                    <div className="h-6 w-28 rounded-full bg-viola-100 animate-pulse motion-reduce:animate-none" />
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
                        className="pressable group flex items-center gap-3 md:gap-5 min-h-16 p-4 md:p-5 rounded-card bg-white border border-viola/15 hover:bg-crema transition-colors"
                      >
                        <div className="size-14 md:size-16 rounded-full bg-rosa overflow-hidden shrink-0">
                          {match.targetImage ? (
                            <Image src={match.targetImage} alt="" width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-viola text-xl md:text-2xl font-bold">
                              {match.targetName[0]}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-body md:text-xl font-bold text-viola truncate">
                              {match.targetName}
                            </h3>
                            {rating > 0 && (
                              <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-crema group-hover:bg-white px-2 py-0.5 text-label text-viola tabular-nums">
                                <Star size={12} className="fill-rosso text-rosso" aria-hidden="true" />
                                {match.targetRating}
                              </span>
                            )}
                          </div>
                          {match.chat.blocked ? (
                            <p className="text-sm text-viola-400 font-medium truncate">Conversazione chiusa</p>
                          ) : match.chat.lastMessage ? (
                            <p className={cn("text-sm truncate", match.chat.unread > 0 ? "text-viola font-bold" : "text-viola-500 font-medium")}>
                              {previewText(match.chat.lastMessage)}
                            </p>
                          ) : (
                            match.targetTitle && <p className="text-sm text-viola-500 font-medium truncate">{match.targetTitle}</p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
                            <span
                              className={cn(
                                "inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-label leading-none",
                                TONE_CLASSES[callStatus.tone]
                              )}
                            >
                              <span className="truncate">{callStatus.label}</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-label text-viola-400">
                              <Calendar size={14} strokeWidth={1.75} aria-hidden="true" />
                              Match del {match.matchedAt ? formatEventDayShort(match.matchedAt) : '—'}
                              {match.targetReviewCount > 0 && (
                                <>
                                  <span className="w-1 h-1 bg-viola-200 rounded-full" aria-hidden="true" />
                                  {match.targetReviewCount} recensioni
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {match.chat.lastMessageAt && (
                            <span className={cn("text-label tabular-nums", match.chat.unread > 0 ? "text-rosso font-bold" : "text-viola-400")}>
                              {formatChatTime(match.chat.lastMessageAt, now)}
                            </span>
                          )}
                          {match.chat.unread > 0 ? (
                            <UnreadBadge count={match.chat.unread} />
                          ) : (
                            <div className="size-8 md:size-11 rounded-full flex items-center justify-center text-viola md:border md:border-viola md:bg-white">
                              <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.li>
                  );
                })
              ) : matches.length > 0 ? (
                <li className="text-center py-12 px-6 rounded-card bg-crema">
                  <p className="text-body font-bold text-viola">Nessun match per &ldquo;{search}&rdquo;</p>
                  <p className="text-sm text-viola-500 mt-1">Prova con un altro nome o ruolo.</p>
                </li>
              ) : (
                <li className="text-center py-14 md:py-20 px-6 bg-crema rounded-card">
                  <LogoMark className="size-16 mx-auto mb-5" />
                  <h3 className="text-title text-viola">Ancora nessun match</h3>
                  <p className="text-body text-viola-500 mt-2 max-w-sm mx-auto">
                    Di&apos; helllo a qualcuno: quando ricambia, il match compare qui.
                  </p>
                  <Link
                    href="/dashboard"
                    className={cn(buttonVariants(), "mt-6 md:mt-8 h-12 px-8 text-base")}
                  >
                    Inizia a scoprire
                  </Link>
                </li>
              )}
            </ul>
          )}

          {/* How matches work: a compact note after the list, so the list stays first */}
          {!isLoading && (
            <aside className="mt-6 md:mt-10 flex items-start gap-3 p-5 md:p-6 rounded-card bg-rosa">
              <div className="size-10 rounded-full bg-white flex items-center justify-center text-viola shrink-0">
                <MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="text-sm text-viola leading-relaxed">
                <span className="font-bold">Chat e colloquio, nello stesso posto.</span>{" "}
                Entra nel match per scrivervi, guarda gli orari proposti e fissa la videochiamata conoscitiva.
              </p>
            </aside>
          )}

          {role === "professional" && applications && <MyApplications result={applications} />}
        </main>
      </div>
    </div>
  );
}
