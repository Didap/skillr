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
import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap } from "lucide-react";
import { duration, ease, haptic, spring } from "@/lib/motion";

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

// A job card and a talent card share the layout, not the wording.
const LABELS = {
  job: { badge: "Opportunità esclusiva", section: "Dettagli posizione", skills: "Requisiti fondamentali", rate: "Budget proposto", like: "Candidati" },
  person: { badge: "Professionista", section: "Profilo", skills: "Competenze", rate: "Tariffa", like: "Mi interessa" },
} as const;

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
        <Card className="relative w-full h-full rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-premium bg-white flex flex-col lg:flex-row group select-none lg:hover:border-emerald-100 p-0 gap-0">
          {/* Swipe feedback: tint and stamp grow with the offset, not only past the threshold */}
          <motion.div
            aria-hidden
            style={{ opacity: likeTint }}
            className="absolute inset-0 z-30 bg-emerald-500/12 pointer-events-none"
          />
          <motion.div
            aria-hidden
            style={{ opacity: passTint }}
            className="absolute inset-0 z-30 bg-rose-500/10 pointer-events-none"
          />
          <motion.div
            aria-hidden
            style={{ opacity: likeOpacity, scale: likeScale, rotate: -12 }}
            className="absolute top-6 left-5 lg:top-10 lg:left-10 z-40 pointer-events-none rounded-2xl border-4 border-emerald-500 bg-white/90 px-4 py-1.5 text-xl lg:text-3xl font-black uppercase tracking-wider text-emerald-600 shadow-lg"
          >
            {labels.like}
          </motion.div>
          <motion.div
            aria-hidden
            style={{ opacity: passOpacity, scale: passScale, rotate: 12 }}
            className="absolute top-6 right-5 lg:top-10 lg:right-10 z-40 pointer-events-none rounded-2xl border-4 border-rose-500 bg-white/90 px-4 py-1.5 text-xl lg:text-3xl font-black uppercase tracking-wider text-rose-600 shadow-lg"
          >
            Passa
          </motion.div>

          {/* ---------- Phone and tablet: one column built for a narrow, tall card ---------- */}
          <div className="lg:hidden flex flex-col h-full min-h-0">
            <div className="relative shrink-0 overflow-hidden bg-slate-950 px-5 pt-5 pb-5">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-600 via-emerald-800 to-slate-950" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.35)_0%,transparent_60%)]" />

              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center overflow-hidden">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt=""
                      width={64}
                      height={64}
                      draggable={false}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="font-display text-3xl italic text-emerald-600">{initial}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display italic text-white text-[1.75rem] leading-[1.05] tracking-tight line-clamp-2">
                    {profile.name}
                  </h2>
                  <p className="mt-1 text-[15px] font-medium text-emerald-100/85 truncate">{profile.title}</p>
                </div>
              </div>

              <div className="relative mt-5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-200/80">{labels.rate}</div>
                  {/* Wraps instead of truncating: a RAL range is wider than half a phone card */}
                  <div className="font-display italic text-white text-[2rem] leading-[1.05] tracking-tight wrap-break-word">
                    {profile.rate}
                  </div>
                </div>
                <div className="shrink-0 max-w-[45%] inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-emerald-50 ring-1 ring-white/15">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </div>
              </div>
            </div>

            {/* Details scroll inside the card; touch-action pan-y on the drag layer keeps
                vertical scrolling native while horizontal intent starts the swipe */}
            <div className="relative flex-1 min-h-0">
              <div className="h-full overflow-y-auto overscroll-contain no-scrollbar px-5 pt-5 pb-8 space-y-5">
                {profile.bioShort && (
                  <p className="text-[15px] leading-relaxed text-slate-600">{profile.bioShort}</p>
                )}
                {profile.skills.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[13px] font-semibold text-slate-500">{labels.skills}</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 px-3 py-1.5 text-[13px] font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {isJob && (
                  <p className="text-[13px] text-slate-500">Trattabile in base all&apos;esperienza</p>
                )}
              </div>
              {/* Hint that the details continue below */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white to-transparent" />
            </div>
          </div>

          {/* ---------- Desktop: the wide two-panel card ---------- */}
          {/* Left Section: Branding & Identity */}
          <div className="hidden lg:flex relative w-[40%] shrink-0 overflow-hidden bg-slate-950 flex-col justify-center p-12">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-600 via-emerald-800 to-slate-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.3)_0%,transparent_70%)]" />

            <div className="relative z-10 flex flex-col items-center text-center gap-8">
              <div className="relative group-hover:rotate-3 transition-transform duration-500">
                <div className="w-40 h-40 rounded-[2.5rem] bg-white p-6 shadow-2xl flex items-center justify-center overflow-hidden relative border border-white/20">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      width={160}
                      height={160}
                      draggable={false}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-display text-6xl font-bold italic">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="absolute -top-3 -right-3 bg-emerald-500 w-12 h-12 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-lg">
                  <Zap size={20} className="text-white" fill="currentColor" />
                </div>
              </div>

              <div className="space-y-4">
                <Badge className="bg-white/10 backdrop-blur-md text-white border-white/10 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  {labels.badge}
                </Badge>
                <h2 className="text-white text-4xl font-display font-bold italic tracking-tight leading-tight line-clamp-3">{profile.title}</h2>
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Main Content */}
          <div className="hidden lg:flex flex-1 min-w-0 bg-white p-12 flex-col gap-10 relative overflow-y-auto overscroll-contain no-scrollbar">
            <div className="space-y-2">
              <div className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-600">{labels.section}</div>
              <h3 className="text-5xl font-display font-bold italic text-slate-950 tracking-tight leading-[0.9] line-clamp-2">
                {profile.name}
              </h3>
            </div>

            <div className="space-y-8">
              {profile.bioShort && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-100 rounded-full" />
                  <div className="pl-8">
                    <p className="text-slate-600 text-lg leading-relaxed italic line-clamp-5">
                      &quot;{profile.bioShort}&quot;
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">{labels.skills}</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 6).map((s) => (
                      <Badge key={s} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold rounded-xl px-3 py-1.5 text-[12px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 border-l border-slate-50 pl-10 flex flex-col justify-center">
                  <div className="space-y-1">
                    <div className="text-[11px] font-black uppercase tracking-widest text-emerald-600">{labels.rate}</div>
                    <div className="text-slate-950 font-display text-4xl xl:text-5xl font-bold italic tracking-tighter leading-[1.05] wrap-break-word">
                      {profile.rate}
                    </div>
                    {isJob && (
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-3">Trattabile in base all&apos;esperienza</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side accent */}
          <div className="hidden lg:block w-2 shrink-0 bg-linear-to-b from-emerald-400 via-emerald-600 to-slate-900" />
        </Card>
      </motion.div>
    </motion.div>
  );
}
