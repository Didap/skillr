"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Calendar, ImageIcon, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";
import { MatchStripes } from "@/components/brand/MatchStripes";
import { cn } from "@/lib/utils";
import { duration, ease, haptic, spring } from "@/lib/motion";

interface MatchOverlayProps {
  profileName: string;
  profileImage?: string;
  onClose: () => void;
  matchId: string;
}

interface Party {
  name: string;
  image?: string | null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * The match moment ("È un helllo"): full screen on phones, safe-area aware. One authored
 * entrance: the two cards slide together on the rosa block and the "lll" badge pops where
 * they meet, then the copy and actions settle.
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

  // As in the Figma screen, the professional is the white photo card on the left and the
  // company the blu card on the right, whichever side is looking.
  const them: Party = { name: profileName, image: profileImage };
  const self: Party = { name: me?.name || "Tu", image: me?.image };
  const viewerIsCompany = me?.role === "company";
  const professional = viewerIsCompany ? them : self;
  const company = viewerIsCompany ? self : them;

  const slide = reduceMotion ? 0 : 72;
  // Copy and actions follow once the cards have met
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
      className="fixed inset-0 z-[60] flex flex-col bg-white text-viola overflow-y-auto overscroll-contain"
    >
      <div className="pt-safe shrink-0">
        <div className="flex justify-start px-4 pt-4 md:px-6 md:pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="pressable size-12 rounded-full border border-viola bg-white flex items-center justify-center text-viola hover:bg-crema"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center px-4 text-center">
        <motion.h2
          id="match-title"
          {...settle(0.28)}
          className="flex items-end justify-center gap-3 text-display text-viola"
        >
          <span className="pb-1">È un</span>
          <Logo className="h-14 md:h-16" title="helllo" />
        </motion.h2>

        {/* The two cards on the rosa block, tilted towards each other */}
        <div className="relative mt-6 w-full aspect-[358/290] rounded-[2.25rem] overflow-hidden bg-rosa">
          <MatchStripes />

          <motion.div
            initial={{ x: -slide, opacity: 0, rotate: -6 }}
            animate={{ x: 0, opacity: 1, rotate: -6 }}
            transition={{ ...spring.card, opacity: { duration: duration.state } }}
            className="absolute left-[5%] top-[14%] w-[45%] aspect-[164/194] rounded-[1.375rem] border border-viola bg-white overflow-hidden flex flex-col"
          >
            <div className="relative flex-1 flex items-center justify-center text-viola-300">
              {professional.image ? (
                <Image src={professional.image} alt={professional.name} fill sizes="180px" className="object-cover" unoptimized />
              ) : (
                <ImageIcon size={30} strokeWidth={1.75} aria-hidden />
              )}
            </div>
            <div className="shrink-0 bg-viola px-4 py-3 text-left text-body font-medium text-white truncate">
              {professional.name}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: slide, opacity: 0, rotate: 6 }}
            animate={{ x: 0, opacity: 1, rotate: 6 }}
            transition={{ ...spring.card, opacity: { duration: duration.state } }}
            className="absolute right-[5%] top-[14%] w-[45%] aspect-[164/194] rounded-[1.375rem] bg-blu p-4 flex flex-col justify-between text-left"
          >
            <div className="relative size-14 rounded-full bg-white overflow-hidden flex items-center justify-center text-xl font-medium text-blu">
              {company.image ? (
                <Image src={company.image} alt={company.name} fill sizes="56px" className="object-cover" unoptimized />
              ) : (
                <span aria-hidden>{initials(company.name)}</span>
              )}
            </div>
            <div className="text-body font-medium text-white line-clamp-2 wrap-break-word">{company.name}</div>
          </motion.div>

          {/* The badge pops where the cards meet */}
          <div aria-hidden className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: duration.focal, ease: ease.out, delay: reduceMotion ? 0 : 0.18 }}
            >
              <LogoMark className="size-16" />
            </motion.div>
          </div>
        </div>

        <motion.p {...settle(0.34)} className="mt-6 text-lg font-medium text-viola max-w-xs">
          Vi siete scelti a vicenda. Ora rompete il ghiaccio.
        </motion.p>
      </div>

      {/* Actions at the bottom on phones, within thumb reach */}
      <motion.div
        {...settle(0.4)}
        className="shrink-0 w-full max-w-md mx-auto px-4 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-12 flex flex-col items-center gap-4"
      >
        <Link
          ref={primaryRef}
          href={`/matches/${matchId}`}
          className={cn(buttonVariants(), "h-14 w-full px-8 text-lg gap-2.5")}
        >
          <Calendar size={22} strokeWidth={1.75} /> Fissa un colloquio
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="pressable rounded-full px-3 py-2 text-lg font-medium text-viola underline underline-offset-4 decoration-viola/60 hover:decoration-viola"
        >
          Continua a scoprire
        </button>
      </motion.div>
    </motion.div>
  );
}
