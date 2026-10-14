"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";
import { MatchOverlay } from "./MatchOverlay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, X, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { recordSwipe, type MatchParties } from "@/app/actions/matches";
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
const actionRowClass = "shrink-0 flex items-center justify-center gap-4 pt-4 pb-1 lg:pt-6";
// Reject: white circle, 1px viola outline. Positive: the rosso "helllo!" pill (DESIGN.md)
const passButtonClass =
  "size-16 rounded-full bg-white border border-viola flex items-center justify-center text-viola";
const likeButtonClass =
  "h-16 min-w-[10.5rem] px-9 rounded-full bg-rosso flex items-center justify-center text-white";

export function SwipeStack({ initialProfiles, userRole, onReload }: SwipeStackProps) {
  const [profiles] = useState<Profile[]>(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<{ matchId: string; parties: MatchParties } | null>(null);
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
          toast.success("Helllo inviato!", {
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
      // The server sends both sides; if it couldn't, fall back to the card that was swiped
      const them = { name: swipedProfile.name, image: swipedProfile.image, detail: swipedProfile.title || null };
      const you = { name: "Tu", image: null, detail: null };
      setMatchData({
        matchId: res.matchId || swipedProfile.id,
        parties: res.parties ?? (userRole === "company"
          ? { professional: them, company: you }
          : { professional: you, company: them }),
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

  // A professional's helllo on a job is an application: say so to screen readers too
  const likeLabel = userRole === "professional" ? "Di' helllo e candidati" : "Di' helllo";
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
              className={cn(passButtonClass, "pressable hover:bg-crema")}
            >
              <X size={26} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => frontCardRef.current?.swipe("right")}
              aria-label={likeLabel}
              title={`${likeLabel} (freccia destra)`}
              className={cn(likeButtonClass, "pressable hover:bg-rosso-600")}
            >
              <Logo className="h-8 text-white" title={null} />
              <span aria-hidden className="font-display text-[2.125rem] font-bold leading-none">!</span>
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.view, ease: ease.out }}
          className="m-auto w-full max-w-md flex flex-col items-center gap-6 text-center bg-crema rounded-card px-6 py-10"
        >
          <span className="size-16 rounded-full bg-rosa flex items-center justify-center text-viola">
            <Zap size={28} strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-title text-viola">
              {userRole === 'professional' ? 'Hai visto tutti i lavori!' : 'Hai finito i talenti!'}
            </h3>
            <p className="text-body text-viola-500 mt-2">
              {userRole === 'professional' ? 'Torna più tardi per nuove opportunità.' : 'Torna più tardi per nuovi match.'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={resetStack}
            disabled={reloading}
            className="h-12 px-8 gap-2 text-base w-full sm:w-auto"
          >
            <RefreshCw size={18} className={reloading ? "animate-spin motion-reduce:animate-none" : undefined} /> Cerca nuovi
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
        {matchData && (
          <MatchOverlay
            parties={matchData.parties}
            viewerRole={userRole}
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
        <div className="absolute inset-0 rounded-card overflow-hidden bg-crema flex flex-col lg:flex-row">
          {/* Phone: photo area + info block */}
          <div className="lg:hidden flex flex-col h-full">
            <div className="flex-1" />
            <Skeleton className="shrink-0 rounded-none bg-viola-100 p-6 space-y-3.5">
              <div className="h-8 w-3/5 rounded-full bg-viola-200" />
              <div className="h-4 w-2/5 rounded-full bg-viola-200" />
              <div className="h-6 w-full rounded-full bg-viola-200" />
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="h-9 w-20 rounded-full bg-viola-200" />
                <div className="h-9 w-24 rounded-full bg-viola-200" />
                <div className="h-9 w-16 rounded-full bg-viola-200" />
              </div>
            </Skeleton>
          </div>
          {/* Desktop: photo panel + info block */}
          <div className="hidden lg:block w-[40%] shrink-0" />
          <Skeleton className="hidden lg:flex flex-1 flex-col gap-6 rounded-none bg-viola-100 p-12">
            <div className="h-12 w-2/3 rounded-full bg-viola-200" />
            <div className="h-6 w-1/3 rounded-full bg-viola-200" />
            <div className="h-7 w-full rounded-full bg-viola-200" />
            <div className="h-7 w-5/6 rounded-full bg-viola-200" />
          </Skeleton>
        </div>
      </div>
      <div className={actionRowClass} aria-hidden>
        <div className={cn(passButtonClass, "border-viola-200 text-viola-200")}>
          <X size={26} strokeWidth={2} />
        </div>
        <div className={cn(likeButtonClass, "bg-rosso/30")}>
          <Logo className="h-8 text-white" title={null} />
          <span className="font-display text-[2.125rem] font-bold leading-none">!</span>
        </div>
      </div>
    </div>
  );
}
