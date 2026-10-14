"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";
import { MatchOverlay } from "./MatchOverlay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, RefreshCw, X, Zap } from "lucide-react";
import { recordSwipe } from "@/app/actions/matches";
import { applyToJob, passJob } from "@/app/actions/applications";
import { Profile } from "@/types/profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

interface SwipeStackProps {
  initialProfiles: Profile[];
  userRole: "professional" | "company";
  // Refetches the feed; the parent remounts the stack with the new profiles
  onReload: () => Promise<void>;
}

/*
 * Layout shared by the live stack and its loading skeleton. Below lg the card fills the
 * height left between the page header and the action row (no fixed pixel height); from lg
 * the wide two-panel card keeps its desktop size.
 */
const frameClass = "w-full flex-1 min-h-0 flex flex-col justify-center lg:flex-none";
const cardAreaClass =
  "relative w-full flex-1 min-h-[20rem] max-h-[44rem] max-w-md mx-auto lg:flex-none lg:h-[580px] lg:max-h-none lg:max-w-[950px]";
const actionRowClass = "shrink-0 flex items-center justify-center gap-8 pt-5 pb-1 lg:pt-6 lg:gap-6";
const passButtonClass =
  "w-16 h-16 lg:w-14 lg:h-14 rounded-full bg-white ring-1 ring-viola-200 shadow-card flex items-center justify-center text-viola-700";
const likeButtonClass =
  "w-16 h-16 lg:w-14 lg:h-14 rounded-full bg-rosso-600 shadow-lg shadow-rosso-600/30 flex items-center justify-center text-white";

export function SwipeStack({ initialProfiles, userRole, onReload }: SwipeStackProps) {
  const [profiles] = useState<Profile[]>(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<{ name: string, image: string | null, matchId: string } | null>(null);
  const [reloading, setReloading] = useState(false);
  const frontCardRef = useRef<SwipeCardHandle>(null);
  // How far the top card is from committing (0..1); the card behind rises with it
  const stackProgress = useMotionValue(0);

  const isStackEmpty = currentIndex >= profiles.length;

  const handleSwipe = async (direction: "left" | "right") => {
    const swipedProfile = profiles[currentIndex];
    // Reset before the next card is promoted so the new card behind starts in its resting spot
    stackProgress.jump(0);
    setCurrentIndex((prev) => prev + 1);

    if (swipedProfile.type === "job") {
      if (direction === "right") {
        const res = await applyToJob(swipedProfile.id);
        if (res.success) {
          toast.success("Candidatura inviata!", {
            description: `Ti sei candidato per: ${swipedProfile.name}`,
            icon: <Zap size={14} className="text-rosso-500" />,
          });
        } else {
          toast.error(res.error || "Errore durante la candidatura");
        }
      } else {
        // Recorded so the job doesn't come back in the feed
        const res = await passJob(swipedProfile.id);
        if (res.error) toast.error(res.error);
      }
      return;
    }

    const targetType = userRole === "company" ? "professional" : "company";
    const res = await recordSwipe(swipedProfile.id, targetType, direction);

    if (res.error) {
      toast.error(res.error);
    } else if (res.isMatch) {
      setMatchData({
        name: swipedProfile.name,
        image: swipedProfile.image,
        matchId: res.matchId || swipedProfile.id
      });
    }
  };

  // Arrow keys do what the buttons do, unless focus is in a text field or the match overlay is open
  useEffect(() => {
    if (isStackEmpty || matchData) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "ArrowLeft") frontCardRef.current?.swipe("left");
      if (e.key === "ArrowRight") frontCardRef.current?.swipe("right");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isStackEmpty, matchData]);

  const resetStack = async () => {
    setReloading(true);
    await onReload();
    setReloading(false);
  };

  const likeLabel = userRole === "professional" ? "Candidati" : "Mi interessa";
  const nextProfile = profiles[currentIndex + 1];
  const frontProfile = profiles[currentIndex];

  return (
    <>
      {!isStackEmpty ? (
        <div className={frameClass}>
          <div className={cardAreaClass}>
            {/* Keyed by profile: the card behind is the same instance that gets promoted, so
                it carries on from where it rose to instead of re-mounting */}
            {nextProfile && (
              <SwipeCard
                key={nextProfile.id}
                profile={nextProfile}
                onSwipe={() => {}}
                isFront={false}
                stackProgress={stackProgress}
              />
            )}
            <SwipeCard
              key={frontProfile.id}
              ref={frontCardRef}
              profile={frontProfile}
              onSwipe={handleSwipe}
              isFront={true}
              stackProgress={stackProgress}
            />
          </div>

          {/* Same action as dragging, for touch, mouse and keyboard users */}
          <div className={actionRowClass}>
            <button
              type="button"
              onClick={() => frontCardRef.current?.swipe("left")}
              aria-label="Passa"
              title="Passa (freccia sinistra)"
              className={cn(
                passButtonClass,
                "pressable hover:text-viola-950 hover:ring-viola-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-viola-300"
              )}
            >
              <X size={28} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => frontCardRef.current?.swipe("right")}
              aria-label={likeLabel}
              title={`${likeLabel} (freccia destra)`}
              className={cn(
                likeButtonClass,
                "pressable hover:bg-rosso-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rosso-200"
              )}
            >
              <Heart size={28} fill="currentColor" />
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.view, ease: ease.out }}
          className="m-auto w-full max-w-md flex flex-col items-center gap-6 text-center bg-white rounded-3xl border border-viola-100 shadow-premium px-6 py-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-rosso-50 flex items-center justify-center text-rosso-600">
            <Zap size={32} />
          </div>
          <div>
            <h3 className="font-display text-3xl text-viola-950">
              {userRole === 'professional' ? 'Hai visto tutti i lavori!' : 'Hai finito i talenti!'}
            </h3>
            <p className="text-base text-viola-500 mt-2">
              {userRole === 'professional' ? 'Torna più tardi per nuove opportunità.' : 'Torna più tardi per nuovi match.'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={resetStack}
            disabled={reloading}
            className="pressable rounded-full h-12 px-8 gap-2 border-viola-200 font-bold w-full sm:w-auto"
          >
            <RefreshCw size={18} className={reloading ? "animate-spin motion-reduce:animate-none" : undefined} /> Cerca Nuovi
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {matchData && (
          <MatchOverlay
            profileName={matchData.name}
            profileImage={matchData.image || undefined}
            matchId={matchData.matchId}
            onClose={() => setMatchData(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Loading state in the shape of the real stack, so nothing jumps when the feed arrives. */
export function SwipeStackSkeleton() {
  return (
    <div className={frameClass} aria-busy="true" aria-label="Caricamento profili">
      <div className={cardAreaClass}>
        <div className="absolute inset-0 rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden border border-viola-100 shadow-premium bg-white flex flex-col lg:flex-row">
          {/* Phone: band + details */}
          <div className="lg:hidden flex flex-col h-full">
            <Skeleton className="shrink-0 rounded-none p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-viola-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-3/4 rounded-full bg-viola-200" />
                  <div className="h-4 w-1/2 rounded-full bg-viola-200" />
                </div>
              </div>
              <div className="h-8 w-2/5 rounded-full bg-viola-200" />
            </Skeleton>
            <Skeleton className="rounded-none bg-transparent p-5 space-y-3">
              <div className="h-4 w-full rounded-full bg-viola-100" />
              <div className="h-4 w-11/12 rounded-full bg-viola-100" />
              <div className="h-4 w-2/3 rounded-full bg-viola-100" />
              <div className="flex flex-wrap gap-2 pt-3">
                <div className="h-8 w-20 rounded-xl bg-viola-100" />
                <div className="h-8 w-24 rounded-xl bg-viola-100" />
                <div className="h-8 w-16 rounded-xl bg-viola-100" />
              </div>
            </Skeleton>
          </div>
          {/* Desktop: two panels */}
          <Skeleton className="hidden lg:flex w-[40%] shrink-0 rounded-none items-center justify-center">
            <div className="w-40 h-40 rounded-[2.5rem] bg-viola-200" />
          </Skeleton>
          <Skeleton className="hidden lg:flex flex-1 flex-col gap-6 rounded-none bg-transparent p-12">
            <div className="h-12 w-2/3 rounded-full bg-viola-100" />
            <div className="h-5 w-full rounded-full bg-viola-100" />
            <div className="h-5 w-5/6 rounded-full bg-viola-100" />
            <div className="h-5 w-1/2 rounded-full bg-viola-100" />
          </Skeleton>
        </div>
      </div>
      <div className={actionRowClass} aria-hidden>
        <div className={cn(passButtonClass, "text-viola-300")}>
          <X size={28} strokeWidth={2.5} />
        </div>
        <div className={cn(likeButtonClass, "bg-rosso-600/30 shadow-none")}>
          <Heart size={28} fill="currentColor" />
        </div>
      </div>
    </div>
  );
}
