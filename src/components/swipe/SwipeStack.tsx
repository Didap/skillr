"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { MatchOverlay } from "./MatchOverlay";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap } from "lucide-react";
import { recordSwipe } from "@/app/actions/matches";
import { applyToJob } from "@/app/actions/applications";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/profile";
import { toast } from "sonner";

export function SwipeStack({ initialProfiles, userRole }: { initialProfiles: Profile[], userRole: "professional" | "company" }) {
  const [profiles] = useState<Profile[]>(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<{ name: string, image: string | null, matchId: string } | null>(null);
  const router = useRouter();

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
      }
      return;
    }

    const targetType = userRole === "company" ? "professional" : "company";
    const res = await recordSwipe(swipedProfile.id, targetType, direction);
    
    if (res.isMatch) {
      setMatchData({
        name: swipedProfile.name,
        image: swipedProfile.image,
        matchId: res.matchId || swipedProfile.id
      });
    }
  };

  const resetStack = () => {
    router.refresh(); 
  };

  const isStackEmpty = currentIndex >= profiles.length;

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
                profile={profiles[currentIndex]} 
                onSwipe={handleSwipe} 
                isFront={true}
              />
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
              <Button variant="outline" onClick={resetStack} className="rounded-full gap-2 border-border-strong">
                <RefreshCw size={18} /> Cerca Nuovi
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
