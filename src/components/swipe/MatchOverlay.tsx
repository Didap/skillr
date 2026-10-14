"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Calendar, User, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { duration, ease, haptic, spring } from "@/lib/motion";

interface MatchOverlayProps {
  profileName: string;
  profileImage?: string;
  onClose: () => void;
  matchId: string;
}

/**
 * The match moment: full screen on phones, safe-area aware. One authored entrance: the two
 * avatars slide together and a glow blooms where they meet, then the copy and actions settle.
 */
export function MatchOverlay({ profileName, profileImage, onClose, matchId }: MatchOverlayProps) {
  const { data: session } = useSession();
  const reduceMotion = useReducedMotion();
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const me = session?.user;

  // The parent passes a fresh callback each render; keep the mount effect from re-running
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // A stronger pattern than the swipe tick: this is the reward
    haptic([14, 60, 28]);
    primaryRef.current?.focus({ preventScroll: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const slide = reduceMotion ? 0 : 72;
  // Copy and actions follow once the avatars have met
  const settle = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.view, ease: ease.out, delay: reduceMotion ? 0 : delay },
  });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: duration.state, ease: ease.out } }}
      exit={{ opacity: 0, transition: { duration: duration.feedback * 1.5, ease: ease.in } }}
      className="fixed inset-0 z-[60] flex flex-col bg-rosso-950/95 backdrop-blur-md text-white overflow-y-auto overscroll-contain"
    >
      <div className="pt-safe shrink-0">
        <div className="flex justify-end px-3 pt-3 md:px-6 md:pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="pressable w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            <X size={26} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative flex items-center justify-center mb-10">
          {/* Glow blooms where the avatars meet */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: duration.focal, ease: ease.out, delay: reduceMotion ? 0 : 0.18 }}
            className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full bg-rosso-400/30 blur-3xl"
          />
          <motion.div
            initial={{ x: -slide, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.card, opacity: { duration: duration.state } }}
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white bg-rosso-800 shadow-2xl overflow-hidden -mr-4 z-10"
          >
            {me?.image ? (
              <Image src={me.image} alt="Tu" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                {me?.name ? (
                  <span className="font-display text-5xl ">{me.name[0]}</span>
                ) : (
                  <User size={40} />
                )}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ x: slide, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring.card, opacity: { duration: duration.state } }}
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white bg-viola-800 shadow-2xl overflow-hidden -ml-4"
          >
            {profileImage ? (
              <Image src={profileImage} alt={profileName} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60 font-display text-5xl ">
                {profileName[0]}
              </div>
            )}
          </motion.div>
        </div>

        <motion.h2 id="match-title" {...settle(0.28)} className="font-display text-5xl md:text-8xl leading-none text-white">
          It&apos;s a Match!
        </motion.h2>
        <motion.p {...settle(0.34)} className="mt-4 text-lg md:text-xl text-rosso-100 max-w-sm">
          Tu e {profileName} vi siete piaciuti.
        </motion.p>
      </div>

      {/* Actions at the bottom on phones, within thumb reach; side by side from sm */}
      <motion.div
        {...settle(0.4)}
        className="shrink-0 px-5 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-16 flex flex-col sm:flex-row sm:justify-center gap-3"
      >
        <Link
          ref={primaryRef}
          href={`/matches/${matchId}`}
          className={cn(
            buttonVariants(),
            "pressable rounded-full h-14 px-8 text-lg font-semibold bg-white text-rosso-950 hover:bg-rosso-50 gap-2 w-full sm:w-auto focus-visible:ring-4 focus-visible:ring-white/40"
          )}
        >
          <Calendar size={20} /> Pianifica Call
        </Link>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "pressable rounded-full h-14 px-8 text-lg font-semibold bg-transparent border-rosso-700 text-rosso-100 hover:bg-rosso-800 hover:text-white w-full sm:w-auto focus-visible:ring-4 focus-visible:ring-white/30"
          )}
        >
          Continua a cercare
        </button>
      </motion.div>
    </motion.div>
  );
}
