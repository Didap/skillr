"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Banknote, ChevronDown, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { duration, ease, haptic, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { Profile } from "@/types/profile";

export interface SwipeCardHandle {
  swipe: (direction: "left" | "right") => void;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  isFront?: boolean;
  /** 0 at rest, 1 once the top card is past the commit threshold. The card behind rises with it. */
  stackProgress: MotionValue<number>;
  ref?: Ref<SwipeCardHandle>;
}

// A job card and a talent card share the layout, not the wording or the colour:
// talent cards use the blu info block of the Figma candidate card, job cards (a company
// speaking) use viola, so the two are told apart at a glance.
const LABELS = {
  job: { skills: "Requisiti", rate: "Budget proposto", block: "bg-viola" },
  person: { skills: "Competenze", rate: "Tariffa", block: "bg-blu" },
} as const;

// Chips shown on the collapsed card; the rest go in a "+N" chip until the card is expanded
const COLLAPSED_CHIPS = 3;

// Horizontal travel that commits a swipe, and the release speed that commits a flick
const COMMIT_OFFSET = 110;
const COMMIT_VELOCITY = 550;
const FLICK_MIN_OFFSET = 30;

export function SwipeCard({ profile, onSwipe, isFront = false, stackProgress, ref }: SwipeCardProps) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Finger-driven values (front card only)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  // Rotation tracks the offset; the pivot (transformOrigin below) sits near the bottom so the card swings like it is held
  const rotate = useTransform(x, [-300, 0, 300], [-11, 0, 11], { clamp: false });
  const likeOpacity = useTransform(x, [16, COMMIT_OFFSET], [0, 1]);
  const passOpacity = useTransform(x, [-COMMIT_OFFSET, -16], [1, 0]);
  const likeScale = useTransform(x, [16, COMMIT_OFFSET], [0.85, 1]);
  const passScale = useTransform(x, [-COMMIT_OFFSET, -16], [1, 0.85]);
  const likeTint = useTransform(x, [0, 180], [0, 1]);
  const passTint = useTransform(x, [-180, 0], [1, 0]);

  // Stack position: the card behind sits lower and smaller, and rises as the top card leaves
  const frontness = useMotionValue(isFront ? 1 : 0);
  const springCfg = { stiffness: spring.card.stiffness, damping: spring.card.damping };
  const stackScale = useSpring(
    useTransform([frontness, stackProgress], ([f, p]: number[]) => (f ? 1 : 0.94 + 0.06 * p)),
    springCfg
  );
  const stackY = useSpring(
    useTransform([frontness, stackProgress], ([f, p]: number[]) => (f ? 0 : 26 * (1 - p))),
    springCfg
  );
  // Layout effect: the promoted card must not paint one frame in its "behind" position
  useLayoutEffect(() => {
    frontness.set(isFront ? 1 : 0);
    if (reduceMotion) {
      stackScale.jump(isFront ? 1 : 0.94);
      stackY.jump(isFront ? 0 : 26);
    }
  }, [isFront, frontness, reduceMotion, stackScale, stackY]);

  // Guards against a drag and a button press (or two presses) firing the same card twice
  const leavingRef = useRef(false);
  const draggingRef = useRef(false);
  const zoneRef = useRef<-1 | 0 | 1>(0);

  const isJob = profile.type === "job";
  const labels = isJob ? LABELS.job : LABELS.person;
  const initial = ((isJob ? profile.title : profile.name)[0] || "?").toUpperCase();
  // Phone card: details are clamped until the crema button expands them (the block scrolls)
  const [expanded, setExpanded] = useState(false);
  const visibleSkills = profile.skills.slice(0, expanded ? 10 : COLLAPSED_CHIPS);
  const hiddenSkills = profile.skills.length - visibleSkills.length;

  useMotionValueEvent(x, "change", (v) => {
    if (!isFront) return;
    stackProgress.set(Math.min(Math.abs(v) / (COMMIT_OFFSET * 1.4), 1));
    if (!draggingRef.current) return;
    // A light tick each time the finger enters a commit zone
    const zone = v > COMMIT_OFFSET ? 1 : v < -COMMIT_OFFSET ? -1 : 0;
    if (zone !== zoneRef.current) {
      if (zone !== 0) haptic(8);
      zoneRef.current = zone;
    }
  });

  /**
   * Sends the card off-screen. `velocity` is the release vector of a drag; buttons and
   * arrow keys pass none and get an accelerating exit along the same path.
   */
  const flyOut = async (direction: "left" | "right", velocity?: { x: number; y: number }) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    haptic(12);
    const sign = direction === "right" ? 1 : -1;

    if (reduceMotion) {
      await animate(opacity, 0, { duration: duration.feedback });
      onSwipe(direction);
      return;
    }

    const width = cardRef.current?.offsetWidth ?? 400;
    const targetX = sign * (window.innerWidth / 2 + width + 80);
    const travel = Math.abs(targetX - x.get());

    if (velocity) {
      // Keep the release speed (never slower than a brisk flick) and the release angle
      const speed = Math.max(Math.abs(velocity.x), 1400);
      const slope = Math.max(-0.5, Math.min(0.5, velocity.y / Math.max(Math.abs(velocity.x), 1)));
      const t = Math.max(0.18, Math.min(0.4, travel / speed));
      await Promise.all([
        animate(x, targetX, { duration: t, ease: "linear" }),
        animate(y, y.get() + slope * travel, { duration: t, ease: "linear" }),
      ]);
    } else {
      await animate(x, targetX, { duration: duration.view, ease: [0.32, 0, 0.67, 0] });
    }
    onSwipe(direction);
  };

  // Buttons and arrow keys: same exit as a drag, stamps included (they follow x)
  useImperativeHandle(ref, () => ({
    swipe: (direction) => {
      flyOut(direction);
    },
  }));

  const handleDragStart = () => {
    draggingRef.current = true;
    zoneRef.current = 0;
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    draggingRef.current = false;
    if (leavingRef.current) return;
    const offset = x.get();
    const vx = info.velocity.x;
    const flick = Math.abs(vx) > COMMIT_VELOCITY && Math.abs(offset) > FLICK_MIN_OFFSET && Math.sign(vx) === Math.sign(offset);

    if (flick || Math.abs(offset) > COMMIT_OFFSET) {
      flyOut(offset > 0 ? "right" : "left", info.velocity);
    } else {
      animate(x, 0, { ...spring.snappy, velocity: vx });
      animate(y, 0, spring.snappy);
    }
  };

  const statusPill = isJob && profile.remoteOk ? <StatusPill>Anche da remoto</StatusPill> : null;

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body text-white">
      <span className="inline-flex min-w-0 items-center gap-2">
        <MapPin size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
        <span className="truncate">{profile.location}</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-2">
        <Banknote size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
        <span className="sr-only">{labels.rate}:</span>
        <span className="wrap-break-word">{profile.rate}</span>
      </span>
    </div>
  );

  const chip = "rounded-full bg-rosa px-4 py-2 text-chip text-viola";

  return (
    <motion.div
      aria-hidden={isFront ? undefined : true}
      inert={!isFront}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.state, ease: ease.out }}
      style={{ scale: stackScale, y: stackY }}
      className={
        isFront
          ? "absolute inset-0 z-20"
          : "absolute inset-0 z-10 pointer-events-none select-none"
      }
    >
      <motion.div
        ref={cardRef}
        drag={isFront ? "x" : false}
        dragDirectionLock
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, y, rotate, opacity, transformOrigin: "50% 90%" }}
        className={isFront ? "h-full w-full cursor-grab active:cursor-grabbing" : "h-full w-full"}
      >
        <Card className="relative w-full h-full rounded-card overflow-hidden ring-0 shadow-card bg-crema flex flex-col lg:flex-row select-none p-0 gap-0">
          {/* Swipe feedback: tint and stamp grow with the offset, not only past the threshold */}
          <motion.div
            aria-hidden
            style={{ opacity: likeTint }}
            className="absolute inset-0 z-30 bg-rosso/15 pointer-events-none"
          />
          <motion.div
            aria-hidden
            style={{ opacity: passTint }}
            className="absolute inset-0 z-30 bg-viola/10 pointer-events-none"
          />
          {/* Stamps: the positive one is the "helllo!" of the action bar, the other a plain "Passa" */}
          <motion.div
            aria-hidden
            style={{ opacity: likeOpacity, scale: likeScale, rotate: -12 }}
            className="absolute top-6 left-5 lg:top-10 lg:left-10 z-40 pointer-events-none inline-flex items-center rounded-full bg-rosso px-6 h-14 lg:h-16 text-white"
          >
            <Logo className="h-7 lg:h-8 text-white" title={null} />
            <span className="font-display text-[2rem] font-bold leading-none">!</span>
          </motion.div>
          <motion.div
            aria-hidden
            style={{ opacity: passOpacity, scale: passScale, rotate: 12 }}
            className="absolute top-6 right-5 lg:top-10 lg:right-10 z-40 pointer-events-none inline-flex items-center rounded-full border-2 border-viola bg-white px-6 h-14 lg:h-16 text-title text-viola"
          >
            Passa
          </motion.div>

          {/* ---------- Phone and tablet: photo on top, coloured info block below ---------- */}
          <div className="lg:hidden flex flex-col h-full min-h-0">
            <div className="relative flex-1 min-h-0">
              <CardPhoto profile={profile} isJob={isJob} initial={initial} alt="" sizes="448px" />
              {statusPill && <div className="absolute left-4 bottom-4 z-10">{statusPill}</div>}
            </div>

            {/* Grows when expanded and then scrolls inside the card; touch-action pan-y on the
                drag layer keeps vertical scrolling native while horizontal intent starts the swipe */}
            <div
              className={cn(
                "shrink min-h-0 overflow-y-auto overscroll-contain no-scrollbar p-6 flex flex-col gap-3.5",
                labels.block
              )}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-title text-white line-clamp-2 wrap-break-word">{profile.name}</h2>
                  <p className="mt-1.5 text-body text-rosa truncate">{profile.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  aria-label={expanded ? "Mostra meno dettagli" : "Mostra tutti i dettagli"}
                  className="pressable shrink-0 size-10 rounded-full bg-crema text-viola flex items-center justify-center hover:bg-white focus-visible:outline-white"
                >
                  <ChevronDown
                    size={22}
                    strokeWidth={2}
                    className={cn("transition-transform duration-200 motion-reduce:transition-none", expanded && "rotate-180")}
                  />
                </button>
              </div>

              {profile.bioShort && (
                <p className={cn("font-prompt text-prompt text-white wrap-break-word", !expanded && "line-clamp-2")}>
                  {profile.bioShort}
                </p>
              )}

              {meta}

              {profile.skills.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label={labels.skills}>
                  {visibleSkills.map((s) => (
                    <li key={s} className={chip}>
                      {s}
                    </li>
                  ))}
                  {hiddenSkills > 0 && (
                    <li className={chip}>
                      <span aria-hidden>+{hiddenSkills}</span>
                      <span className="sr-only">e altre {hiddenSkills}</span>
                    </li>
                  )}
                </ul>
              )}

              {isJob && expanded && (
                <p className="text-label text-crema">Trattabile in base all&apos;esperienza</p>
              )}
            </div>
          </div>

          {/* ---------- Desktop: photo panel on the left, the info block fills the rest ---------- */}
          <div className="hidden lg:block relative w-[40%] shrink-0">
            <CardPhoto profile={profile} isJob={isJob} initial={initial} alt={profile.name} sizes="380px" />
            {statusPill && <div className="absolute left-8 bottom-8 z-10">{statusPill}</div>}
          </div>

          <div
            className={cn(
              "hidden lg:flex flex-1 min-w-0 p-12 flex-col gap-5 overflow-y-auto overscroll-contain no-scrollbar",
              labels.block
            )}
          >
            <div>
              <h3 className="text-display text-white line-clamp-2 wrap-break-word">{profile.name}</h3>
              <p className="mt-2 text-xl font-medium text-rosa line-clamp-2">{profile.title}</p>
            </div>

            {profile.bioShort && (
              <p className="font-prompt text-prompt text-white line-clamp-5 wrap-break-word">{profile.bioShort}</p>
            )}

            <div className="space-y-2">
              {meta}
              {isJob && <p className="text-label text-crema">Trattabile in base all&apos;esperienza</p>}
            </div>

            {profile.skills.length > 0 && (
              <div className="mt-auto space-y-3">
                <div className="text-label text-rosa">{labels.skills}</div>
                <ul className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 8).map((s) => (
                    <li key={s} className={chip}>
                      {s}
                    </li>
                  ))}
                  {profile.skills.length > 8 && (
                    <li className={chip}>
                      <span aria-hidden>+{profile.skills.length - 8}</span>
                      <span className="sr-only">e altre {profile.skills.length - 8}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/** Photo area: a person's photo fills it; a company logo sits on a white tile; crema otherwise. */
function CardPhoto({
  profile,
  isJob,
  initial,
  alt,
  sizes,
}: {
  profile: Profile;
  isJob: boolean;
  initial: string;
  alt: string;
  sizes: string;
}) {
  if (!profile.image) {
    return (
      <div className="absolute inset-0 bg-crema flex items-center justify-center">
        <span className="size-24 rounded-full bg-rosa text-viola text-display flex items-center justify-center">
          {initial}
        </span>
      </div>
    );
  }
  if (isJob) {
    return (
      <div className="absolute inset-0 bg-crema flex items-center justify-center p-8">
        <div className="relative size-32 lg:size-40 rounded-card bg-white overflow-hidden">
          <Image
            src={profile.image}
            alt={alt}
            fill
            sizes="160px"
            draggable={false}
            className="object-contain p-4"
            unoptimized
          />
        </div>
      </div>
    );
  }
  return (
    <Image
      src={profile.image}
      alt={alt}
      fill
      sizes={sizes}
      draggable={false}
      className="object-cover bg-crema"
      unoptimized
    />
  );
}

/** Rosso status pill with a white dot (DESIGN.md "Status pill"). */
function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-rosso px-4 h-8 text-chip font-bold text-white">
      <span aria-hidden className="size-2 rounded-full bg-white" />
      {children}
    </span>
  );
}
