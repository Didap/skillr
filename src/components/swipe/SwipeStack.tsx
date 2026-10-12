"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";
import { MatchOverlay } from "./MatchOverlay";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw, X, Zap } from "lucide-react";
import { recordSwipe } from "@/app/actions/matches";
import { applyToJob, passJob } from "@/app/actions/applications";
import { Profile } from "@/types/profile";
import { toast } from "sonner";

interface SwipeStackProps {
  initialProfiles: Profile[];
  userRole: "professional" | "company";
  // Refetches the feed; the parent remounts the stack with the new profiles
  onReload: () => Promise<void>;
}

export function SwipeStack({ initialProfiles, userRole, onReload }: SwipeStackProps) {
  const [profiles] = useState<Profile[]>(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<{ name: string, image: string | null, matchId: string } | null>(null);
  const [reloading, setReloading] = useState(false);
  const frontCardRef = useRef<SwipeCardHandle>(null);

  const isStackEmpty = currentIndex >= profiles.length;

  const handleSwipe = async (direction: "left" | "right") => {
    const swipedProfile = profiles[currentIndex];
    setCurrentIndex((prev) => prev + 1);

    if (swipedProfile.type === "job") {
      if (direction === "right") {
        const res = await applyToJob(swipedProfile.id);
        if (res.success) {
          toast.success("Candidatura inviata!", {
            description: `Ti sei candidato per: ${swipedProfile.name}`,
            icon: <Zap size={14} className="text-emerald-500" />,
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

  return (
    <>
      <div className="relative w-full h-[650px] mt-8">
        <AnimatePresence>
          {!isStackEmpty ? (
            <div className="relative w-full h-full">
              {/* Background Card (Preview) */}
              {currentIndex + 1 < profiles.length && (
                <SwipeCard
                  key={profiles[currentIndex + 1].id}
                  profile={profiles[currentIndex + 1]}
                  onSwipe={() => {}}
                  isFront={false}
                />
              )}

              {/* Front Card */}
              <SwipeCard
                key={profiles[currentIndex].id}
                ref={frontCardRef}
                profile={profiles[currentIndex]}
                onSwipe={handleSwipe}
                isFront={true}
              />

              {/* Same action as dragging, for mouse, touch and keyboard users */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex justify-center gap-6 z-50">
                <button
                  type="button"
                  onClick={() => frontCardRef.current?.swipe("left")}
                  aria-label="Passa"
                  title="Passa (freccia sinistra)"
                  className="w-14 h-14 rounded-full bg-white shadow-card flex items-center justify-center text-slate-400 hover:text-slate-950 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  <X size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => frontCardRef.current?.swipe("right")}
                  aria-label={likeLabel}
                  title={`${likeLabel} (freccia destra)`}
                  className="w-14 h-14 rounded-full bg-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  <Heart size={24} fill="currentColor" />
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Zap size={40} />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold italic">
                  {userRole === 'professional' ? 'Hai visto tutti i lavori!' : 'Hai finito i talenti!'}
                </h3>
                <p className="text-text-secondary mt-2">
                  {userRole === 'professional' ? 'Torna più tardi per nuove opportunità.' : 'Torna più tardi per nuovi match.'}
                </p>
              </div>
              <Button variant="outline" onClick={resetStack} disabled={reloading} className="rounded-full gap-2 border-border-strong">
                <RefreshCw size={18} className={reloading ? "animate-spin" : undefined} /> Cerca Nuovi
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
