"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Briefcase, Calendar, ImageIcon, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MatchTitle } from "@/components/brand/MatchTitle";
import { LogoMark } from "@/components/brand/LogoMark";
import { MatchStripes } from "@/components/brand/MatchStripes";
import type { MatchParties } from "@/app/actions/matches";
import { sendMessage } from "@/app/actions/chat";
import { hankenBlackItalic } from "./match-font";
import { cn, inertOutside, isEditableTarget } from "@/lib/utils";
import { beat, duration, ease, enter, haptic } from "@/lib/motion";

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
// the icebreakers one by one, the field and the actions. With reduced motion MotionConfig
// drops every transform, `beat()` collapses the delays and the badge burst is skipped, so
// everything just fades in together.
const T = {
  close: 0.03, title: 0.08, block: 0.42, cards: 0.5, badge: 0.82, pill: 0.95,
  copy: 1.03, copyStep: 0.08, chips: 1.17, chipStep: 0.06, input: 1.36, cta: 1.45, link: 1.53,
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
    const dialog = dialogRef.current;
    // A real modal: the page behind (swipe buttons, nav) can't be reached by Tab or clicks
    const restore = dialog ? inertOutside(dialog) : undefined;
    // Focus lands on the dialog so screen readers announce it, without a ring on the CTA
    dialog?.focus({ preventScroll: true });
    // A stronger pattern than the swipe tick, timed with the badge: this is the reward
    const buzz = window.setTimeout(() => haptic([14, 60, 28]), beat(T.badge, reduceMotion) * 1000);
    const onKeyDown = (e: KeyboardEvent) => {
      // Escape while composing (IME) dismisses the candidates, nothing else
      if (e.key !== "Escape" || e.isComposing) return;
      // In the message field it only leaves the field, back to the dialog; the draft stays
      if (isEditableTarget(e.target)) {
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      restore?.();
      window.clearTimeout(buzz);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reduceMotion]);

  const { professional, company } = parties;
  const recipient = viewerRole === "company" ? professional : company;
  // "Scrivi a Luca…" for a person, the full name for a company
  const recipientName = viewerRole === "company" ? recipient.name.split(/\s+/)[0] : recipient.name;

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
            {...enter(T.close, reduceMotion, { scale: 0.7 })}
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "relative size-10 before:absolute before:-inset-1 before:content-['']")}
          >
            <X size={22} strokeWidth={1.75} />
          </motion.button>
        </div>

        {/* 358x92 in the layout; the art is 358x159 and spills over the block below */}
        <h2 id="match-title" className="relative z-10 shrink-0 w-full aspect-[358/92]">
          <MatchTitle delay={beat(T.title, reduceMotion)} className="absolute inset-x-0 top-0 w-full h-auto overflow-visible" />
        </h2>

        <MatchIllustration parties={parties} reduceMotion={reduceMotion} />

        <p className={cn(hankenBlackItalic.className, "shrink-0 text-center text-title font-black text-viola")}>
          <motion.span {...enter(T.copy, reduceMotion)} className="block">
            Vi siete scelti a vicenda.
          </motion.span>
          <motion.span {...enter(T.copy + T.copyStep, reduceMotion)} className="block">
            Ora rompete il ghiaccio.
          </motion.span>
        </p>

        <Icebreaker
          matchId={matchId}
          suggestions={ICEBREAKERS[viewerRole]}
          recipientName={recipientName}
          reduceMotion={reduceMotion}
        />

        {/* "spazio": takes what's left so the actions sit at the bottom */}
        <div className="flex-1 min-h-1" />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 28, delay: beat(T.cta, reduceMotion), opacity: { duration: duration.state, delay: beat(T.cta, reduceMotion) } }}
          className="shrink-0"
        >
          <Link
            href={`/matches/${matchId}`}
            className={cn(buttonVariants({ size: "xl" }), "w-full font-medium")}
          >
            <Calendar strokeWidth={1.75} /> Fissa un colloquio
          </Link>
        </motion.div>
        <motion.button
          {...enter(T.link, reduceMotion)}
          type="button"
          onClick={onClose}
          className={cn(buttonVariants({ variant: "link" }), "shrink-0 self-center h-[1.375rem] px-0 text-body font-medium")}
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
  const fly = { type: "spring", stiffness: 300, damping: 21, mass: 0.8 } as const;

  return (
    <div className="@container relative shrink-0 w-full aspect-[358/290]">
      <motion.div
        {...enter(T.block, reduceMotion, { scale: 0.92 })}
        className="absolute inset-0 rounded-[10cqw] overflow-hidden bg-rosa"
      >
        <MatchStripes />
      </motion.div>

      {/* Professional: white photo card, name on the viola band */}
      <motion.div
        initial={{ opacity: 0, x: "-120%", y: "8%", rotate: -22 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: -6 }}
        transition={{ ...fly, delay: beat(T.cards, reduceMotion), opacity: { duration: 0.2, delay: beat(T.cards, reduceMotion) } }}
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
        initial={{ opacity: 0, x: "120%", y: "-6%", rotate: 22 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 6 }}
        transition={{ ...fly, delay: beat(T.cards + 0.06, reduceMotion), opacity: { duration: 0.2, delay: beat(T.cards + 0.06, reduceMotion) } }}
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
      <div aria-hidden className="absolute left-1/2 top-[42.76%] w-[16.76%] aspect-square -translate-x-1/2 -translate-y-1/2">
        {!reduceMotion && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full border-[0.9cqw] border-rosso"
              initial={{ scale: 0.9, opacity: 0 }}
              // Starts from 0 opacity: keyframes would otherwise show the ring during the delay
              animate={{ scale: [0.9, 0.9, 2.1], opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.55, ease: ease.out, delay: T.badge + 0.03, times: [0, 0.02, 1] }}
            />
            {BURST.map((p, i) => (
              <motion.span
                key={i}
                className={cn("absolute left-1/2 top-1/2 -ml-[0.9cqw] -mt-[0.7cqw]", p.color, p.shape)}
                style={{ rotate: p.rotate }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: `${p.x}cqw`, y: `${p.y}cqw`, opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.6] }}
                transition={{ duration: 0.65, ease: ease.out, delay: T.badge + 0.03, times: [0, 0.15, 0.7, 1] }}
              />
            ))}
          </>
        )}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0, rotate: -40 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 13, delay: beat(T.badge, reduceMotion), opacity: { duration: 0.1, delay: beat(T.badge, reduceMotion) } }}
        >
          <LogoMark className="size-full" />
        </motion.div>
      </div>

      {/* What the match is about: the professional's role */}
      {professional.detail && (
        <motion.div
          {...enter(T.pill, reduceMotion, { y: 10 })}
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
 * Messages go to the real chat; the dev preview (matchId "preview") keeps them local.
 */
type SentLine = { id: string; text: string; status: "sending" | "sent" | "failed"; error?: string };

function Icebreaker({
  matchId,
  suggestions,
  recipientName,
  reduceMotion,
}: {
  matchId: string;
  suggestions: string[];
  recipientName: string;
  reduceMotion: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<SentLine[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = matchId === "preview";

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const id = crypto.randomUUID();
    setSent((prev) => [...prev, { id, text, status: preview ? "sent" : "sending" }]);
    setDraft("");
    haptic(10);
    if (preview) return;

    const res = await sendMessage(matchId, { clientId: id, body: text }).catch(() => ({ error: "Connessione assente. Riprova." }));
    setSent((prev) =>
      prev.map((m): SentLine => (m.id !== id ? m : "error" in res ? { ...m, status: "failed", error: res.error } : { ...m, status: "sent" }))
    );
    // Keep the text so it can be sent again
    if ("error" in res) setDraft((current) => current || text);
  };
  const last = sent.at(-1);

  return (
    <div className="shrink-0 flex flex-col gap-3.5">
      <AnimatePresence>
        {sent.length === 0 && (
          <motion.ul
            key="chips"
            exit={{ opacity: 0, scale: 0.96, transition: { duration: duration.feedback } }}
            className="flex flex-wrap justify-center gap-x-2 gap-y-2"
            aria-label="Frasi suggerite"
          >
            {suggestions.map((text, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 26, delay: beat(T.chips + i * T.chipStep, reduceMotion) }}
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
        )}
      </AnimatePresence>

      {/* Mounted from the start (empty), so screen readers announce each message added to
          it and the status line under the first one */}
      <div aria-live="polite" className={cn("flex flex-col items-end gap-1.5", sent.length === 0 && "hidden")}>
        <ol className="contents" aria-label="I tuoi messaggi">
          {sent.map((m) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 480, damping: 30 }}
              className={cn(
                "max-w-[85%] origin-bottom-right rounded-3xl rounded-br-md bg-viola px-4 py-2.5 text-body text-white",
                m.status === "failed" && "opacity-60"
              )}
            >
              {m.text}
            </motion.li>
          ))}
        </ol>
        {last && (
          <p className="text-label text-viola-500 pr-1 text-right">
            {preview ? (
              "Anteprima: il messaggio non viene inviato"
            ) : last.status === "sending" ? (
              "Invio…"
            ) : last.status === "failed" ? (
              <span className="text-rosso-700">Non inviato: {last.error} Riprova dal campo qui sotto.</span>
            ) : (
              <Link href={`/matches/${matchId}`} className="font-bold text-viola underline underline-offset-2">
                Inviato · Apri la chat
              </Link>
            )}
          </p>
        )}
      </div>

      <motion.form
        {...enter(T.input, reduceMotion, { y: 10 })}
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
          maxLength={2000}
          className="min-w-0 flex-1 bg-transparent text-body text-viola placeholder:text-viola outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Invia"
          className="pressable size-10 shrink-0 rounded-full bg-viola text-white flex items-center justify-center disabled:bg-viola/40 disabled:cursor-not-allowed"
        >
          <ArrowUp size={20} strokeWidth={2} />
        </button>
      </motion.form>
    </div>
  );
}
