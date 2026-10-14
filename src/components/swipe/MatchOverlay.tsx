"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Briefcase, Calendar, ImageIcon, X } from "lucide-react";
import { MatchTitle } from "@/components/brand/MatchTitle";
import { LogoMark } from "@/components/brand/LogoMark";
import { MatchStripes } from "@/components/brand/MatchStripes";
import type { MatchParties } from "@/app/actions/matches";
import { cn } from "@/lib/utils";
import { duration, ease, haptic } from "@/lib/motion";

interface MatchOverlayProps {
  parties: MatchParties;
  // Who is looking: decides who the icebreakers are addressed to
  viewerRole: "professional" | "company";
  matchId: string;
  onClose: () => void;
}

// Suggested first lines, from the viewer's side (the professional ones are the Figma's)
const ICEBREAKERS = {
  professional: ["Posso mandarti il portfolio?", "Com'è il team?", "Quando ci sentiamo?"],
  company: ["Ci racconti un tuo progetto?", "Quando saresti libero?", "Ti va una call veloce?"],
};

// Timeline of the entrance, in seconds. One thing at a time, top to bottom: the title
// (wordmark, "!", sticker), the block, the cards meet, the badge pops, then the caption,
// the icebreakers one by one, the field and the actions.
const T = {
  close: 0.05, title: 0.15, block: 0.8, cards: 0.95, badge: 1.4, pill: 1.6,
  copy: 1.75, copyStep: 0.12, chips: 2.0, chipStep: 0.1, input: 2.35, cta: 2.5, link: 2.62,
};

// Confetti from the badge: brand colours, one burst
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
  const reach = i % 3 === 0 ? 30 : 22;
  return {
    x: Math.cos(angle) * reach,
    y: Math.sin(angle) * reach,
    color: ["bg-rosso", "bg-blu", "bg-viola", "bg-white"][i % 4],
    shape: i % 3 === 1 ? "w-[3.2cqw] h-[1.4cqw] rounded-full" : "size-[1.8cqw] rounded-full",
    rotate: (angle * 180) / Math.PI,
  };
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * The match moment ("È un helllo"), built on the Figma screen: full screen on phones,
 * safe-area aware. The cards fly in and meet on the rosa block, the "lll" badge pops
 * where they touch, then the icebreakers and actions settle.
 */
export function MatchOverlay({ parties, viewerRole, matchId, onClose }: MatchOverlayProps) {
  const reduceMotion = !!useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  // The parent passes a fresh callback each render; keep the mount effect from re-running
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Focus lands on the dialog so screen readers announce it, without a ring on the CTA
    dialogRef.current?.focus({ preventScroll: true });
    // A stronger pattern than the swipe tick, timed with the badge: this is the reward
    const buzz = window.setTimeout(() => haptic([14, 60, 28]), reduceMotion ? 0 : T.badge * 1000);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(buzz);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reduceMotion]);

  const { professional, company } = parties;
  const recipient = viewerRole === "company" ? professional : company;
  // "Scrivi a Luca…" for a person, the full name for a company
  const recipientName = viewerRole === "company" ? recipient.name.split(/\s+/)[0] : recipient.name;

  // With reduced motion everything simply fades in, together
  const at = (delay: number) => (reduceMotion ? 0 : delay);
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.view, ease: ease.out, delay: at(delay) },
  });

  return (
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: duration.state, ease: ease.out } }}
      exit={{ opacity: 0, transition: { duration: duration.feedback * 1.5, ease: ease.in } }}
      className="fixed inset-0 z-[60] bg-white text-viola overflow-y-auto overflow-x-hidden overscroll-contain outline-none"
    >
      {/* The Figma frame: 390 wide, padding 16/16/20/16, 14 between rows */}
      <div className="mx-auto w-full max-w-[24.375rem] min-h-full flex flex-col gap-3.5 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="h-10 shrink-0 flex">
          <motion.button
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: duration.state, ease: ease.out, delay: at(T.close) }}
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="pressable relative size-10 rounded-full border border-viola bg-white flex items-center justify-center text-viola hover:bg-crema before:absolute before:-inset-1 before:content-['']"
          >
            <X size={22} strokeWidth={1.75} />
          </motion.button>
        </div>

        {/* 358x92 in the layout; the art is 358x159 and spills over the block below */}
        <h2 id="match-title" className="relative z-10 shrink-0 w-full aspect-[358/92]">
          <MatchTitle delay={at(T.title)} reduceMotion={reduceMotion} className="absolute inset-x-0 top-0 w-full h-auto overflow-visible" />
        </h2>

        <MatchIllustration parties={parties} reduceMotion={reduceMotion} />

        <p className="shrink-0 text-center text-[1.75rem] leading-8 font-black italic tracking-[-0.015em] text-viola">
          <motion.span {...rise(T.copy)} className="block">
            Vi siete scelti a vicenda.
          </motion.span>
          <motion.span {...rise(T.copy + T.copyStep)} className="block">
            Ora rompete il ghiaccio.
          </motion.span>
        </p>

        <Icebreaker
          suggestions={ICEBREAKERS[viewerRole]}
          recipientName={recipientName}
          reduceMotion={reduceMotion}
        />

        {/* "spazio": takes what's left so the actions sit at the bottom */}
        <div className="flex-1 min-h-1" />

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24, scale: reduceMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion ? { duration: duration.state } : { type: "spring", stiffness: 300, damping: 24, delay: T.cta }}
          className="shrink-0"
        >
          <Link
            href={`/matches/${matchId}`}
            className="pressable h-14 w-full rounded-full bg-rosso hover:bg-rosso-600 text-white text-body font-medium flex items-center justify-center gap-2"
          >
            <Calendar size={22} strokeWidth={1.75} /> Fissa un colloquio
          </Link>
        </motion.div>
        <motion.button
          {...rise(T.link)}
          type="button"
          onClick={onClose}
          className="pressable shrink-0 self-center h-[1.375rem] text-body font-medium text-viola underline underline-offset-4 decoration-viola/60 hover:decoration-viola"
        >
          Continua a scoprire
        </motion.button>
      </div>
    </motion.div>
  );
}

/*
 * The rosa block with the two cards, laid out in the Figma's 358×290 frame: positions are
 * percentages of that frame and type sizes are container units, so it scales as one piece.
 * Card centres come from the Figma rotations (−6° and +6° about each card's top-left).
 */
function MatchIllustration({ parties, reduceMotion }: { parties: MatchParties; reduceMotion: boolean }) {
  const { professional, company } = parties;
  const at = (delay: number) => (reduceMotion ? 0 : delay);
  const fly = { type: "spring", stiffness: 210, damping: 17, mass: 0.9 } as const;

  return (
    <div className="@container relative shrink-0 w-full aspect-[358/290]">
      <motion.div
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration.focal, ease: ease.out, delay: at(T.block) }}
        className="absolute inset-0 rounded-[10cqw] overflow-hidden bg-rosa"
      >
        <motion.div
          initial={{ x: reduceMotion ? 0 : "-9%" }}
          animate={{ x: 0 }}
          transition={{ duration: 1.6, ease: ease.out, delay: at(T.block) }}
          className="absolute inset-0"
        >
          <MatchStripes />
        </motion.div>
      </motion.div>

      {/* Professional: white photo card, name on the viola band */}
      <motion.div
        initial={reduceMotion ? { opacity: 0, rotate: -6 } : { opacity: 0, x: "-120%", y: "8%", rotate: -22 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: -6 }}
        transition={reduceMotion ? { duration: duration.state } : { ...fly, delay: T.cards, opacity: { duration: 0.2, delay: T.cards } }}
        className="absolute left-[6.1%] top-[16.42%] w-[41.9%] h-[67.59%] rounded-[6.7cqw] border border-viola bg-white overflow-hidden flex flex-col"
      >
        <div className="relative flex-1 flex items-center justify-center text-viola/50">
          {professional.image ? (
            <Image src={professional.image} alt={professional.name} fill sizes="180px" className="object-cover" unoptimized />
          ) : (
            <ImageIcon className="size-[6.7cqw]" strokeWidth={1.75} aria-hidden />
          )}
        </div>
        <div className="h-[21.4%] shrink-0 bg-viola px-[4.5cqw] flex items-center text-[4.47cqw] font-medium text-crema">
          <span className="truncate">{professional.name}</span>
        </div>
      </motion.div>

      {/* Company: blu card with logo or initials */}
      <motion.div
        initial={reduceMotion ? { opacity: 0, rotate: 6 } : { opacity: 0, x: "120%", y: "-6%", rotate: 22 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 6 }}
        transition={
          reduceMotion
            ? { duration: duration.state }
            : { ...fly, delay: T.cards + 0.06, opacity: { duration: 0.2, delay: T.cards + 0.06 } }
        }
        className="absolute left-[52.33%] top-[16.31%] w-[41.9%] h-[67.59%] rounded-[6.7cqw] bg-blu p-[3.9cqw] pt-[5.5cqw] flex flex-col justify-between text-left"
      >
        <div className="relative size-[15.64cqw] rounded-full bg-white overflow-hidden flex items-center justify-center text-[5.6cqw] font-medium text-blu">
          {company.image ? (
            <Image src={company.image} alt={company.name} fill sizes="64px" className="object-cover" unoptimized />
          ) : (
            <span aria-hidden>{initials(company.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[5.03cqw] leading-[1.15] font-medium text-white line-clamp-2 wrap-break-word">{company.name}</p>
          {company.detail && (
            <p className="mt-[0.6cqw] text-[3.63cqw] leading-tight text-crema line-clamp-2">{company.detail}</p>
          )}
        </div>
      </motion.div>

      {/* The badge pops where the cards touch, with a ring and a small burst */}
      <div aria-hidden className="absolute left-1/2 top-[42.76%] size-[16.76%] aspect-square -translate-x-1/2 -translate-y-1/2" style={{ height: "auto" }}>
        {!reduceMotion && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full border-[0.9cqw] border-rosso"
              initial={{ scale: 0.9, opacity: 0 }}
              // Starts from 0 opacity: keyframes would otherwise show the ring during the delay
              animate={{ scale: [0.9, 0.9, 2.1], opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.75, ease: ease.out, delay: T.badge + 0.05, times: [0, 0.02, 1] }}
            />
            {BURST.map((p, i) => (
              <motion.span
                key={i}
                className={cn("absolute left-1/2 top-1/2 -ml-[0.9cqw] -mt-[0.7cqw]", p.color, p.shape)}
                style={{ rotate: p.rotate }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: `${p.x}cqw`, y: `${p.y}cqw`, opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.6] }}
                transition={{ duration: 0.9, ease: ease.out, delay: T.badge + 0.04, times: [0, 0.15, 0.7, 1] }}
              />
            ))}
          </>
        )}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0, rotate: reduceMotion ? 0 : -40 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={
            reduceMotion
              ? { duration: duration.state }
              : { type: "spring", stiffness: 520, damping: 13, delay: T.badge, opacity: { duration: 0.1, delay: T.badge } }
          }
        >
          <LogoMark className="size-full" />
        </motion.div>
      </div>

      {/* What the match is about: the professional's role */}
      {professional.detail && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.view, ease: ease.out, delay: at(T.pill) }}
          className="absolute left-1/2 -translate-x-1/2 top-[82.07%] h-[11.72%] max-w-[86%] rounded-full bg-white px-[4.5cqw] flex items-center gap-[2.2cqw] text-[4.2cqw] text-viola whitespace-nowrap"
        >
          <Briefcase className="size-[5.6cqw] shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="truncate">{professional.detail}</span>
        </motion.div>
      )}
    </div>
  );
}

/*
 * First message after the match: suggested lines plus a text field, as in the Figma.
 * Front-end only for now: messages stay in this component and are not sent anywhere
 * until the chat backend exists.
 */
function Icebreaker({
  suggestions,
  recipientName,
  reduceMotion,
}: {
  suggestions: string[];
  recipientName: string;
  reduceMotion: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const at = (delay: number) => (reduceMotion ? 0 : delay);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSent((prev) => [...prev, text]);
    setDraft("");
    haptic(10);
  };

  return (
    <div className="shrink-0 flex flex-col gap-3.5">
      <AnimatePresence mode="popLayout">
        {sent.length === 0 ? (
          <motion.ul
            key="chips"
            exit={{ opacity: 0, scale: 0.96, transition: { duration: duration.feedback } }}
            className="flex flex-wrap justify-center gap-x-2 gap-y-2"
            aria-label="Frasi suggerite"
          >
            {suggestions.map((text, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10, scale: reduceMotion ? 1 : 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 26, delay: at(T.chips + i * T.chipStep) }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDraft(text);
                    inputRef.current?.focus();
                  }}
                  className="pressable h-[2.125rem] rounded-full bg-rosa px-3.5 text-chip text-viola hover:bg-rosso-100"
                >
                  {text}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <motion.ol key="sent" className="flex flex-col items-end gap-1.5" aria-live="polite" aria-label="Messaggi inviati">
            {sent.map((text, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 480, damping: 30 }}
                className="max-w-[85%] origin-bottom-right rounded-3xl rounded-br-md bg-viola px-4 py-2.5 text-body text-white"
              >
                {text}
              </motion.li>
            ))}
            <li className="text-label text-viola-500 pr-1">Inviato</li>
          </motion.ol>
        )}
      </AnimatePresence>

      <motion.form
        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.view, ease: ease.out, delay: at(T.input) }}
        onSubmit={send}
        className="flex h-[3.25rem] items-center gap-2 rounded-full bg-crema pl-[1.125rem] pr-1.5 focus-within:ring-3 focus-within:ring-ring/50"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Scrivi a ${recipientName}…`}
          aria-label={`Scrivi a ${recipientName}`}
          enterKeyHint="send"
          maxLength={500}
          className="min-w-0 flex-1 bg-transparent text-body text-viola placeholder:text-viola outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Invia"
          className="pressable size-10 shrink-0 rounded-full bg-viola text-white flex items-center justify-center disabled:opacity-100 disabled:bg-viola/90"
        >
          <ArrowUp size={20} strokeWidth={2} />
        </button>
      </motion.form>
    </div>
  );
}
