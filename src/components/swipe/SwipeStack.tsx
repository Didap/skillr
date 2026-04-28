"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { MatchOverlay } from "./MatchOverlay";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap } from "lucide-react";
import { recordSwipe } from "@/app/actions/matches";
import { useRouter } from "next/navigation";

export function SwipeStack({ initialProfiles, userRole }: { initialProfiles: any[], userRole: "professional" | "company" }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<{ name: string, image?: string, matchId: string } | null>(null);
  const router = useRouter();

  const handleSwipe = async (direction: "left" | "right") => {
    const swipedProfile = profiles[currentIndex];
    setCurrentIndex((prev) => prev + 1);

    const targetType = userRole === "company" ? "professional" : "company";
    const res = await recordSwipe(swipedProfile.id, targetType, direction);
    
    if (res.isMatch) {
      setMatchData({
        name: swipedProfile.name,
        image: swipedProfile.image,
        matchId: swipedProfile.id // In a real app, this should be the actual Match ID returned from the DB
      });
    }
  };

  const resetStack = () => {
    router.refresh(); 
  };

  const isStackEmpty = currentIndex >= profiles.length;

  return (
    <>
      <div className="relative w-full h-[600px] flex items-center justify-center">
        <AnimatePresence>
          {!isStackEmpty ? (
            <div className="relative w-full flex justify-center h-full">
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
                <h3 className="font-display text-2xl font-bold italic">Hai finito i talenti!</h3>
                <p className="text-text-secondary mt-2">Torna più tardi per nuovi match.</p>
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
            profileImage={matchData.image}
            matchId={matchData.matchId}
            onClose={() => setMatchData(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
