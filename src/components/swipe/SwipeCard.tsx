"use client";

import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence, type PanInfo } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, X, Heart } from "lucide-react";

import { Profile } from "@/types/profile";

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  isFront?: boolean;
}

export function SwipeCard({ profile, onSwipe, isFront = false }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-100, 0, 100], [0.98, 1, 0.98]);
  const controls = useAnimation();

  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] } });
      onSwipe("right");
    } else if (info.offset.x < -100) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] } });
      onSwipe("left");
    } else {
      controls.start({ x: 0, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
    setSwipeDirection(null);
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 50) setSwipeDirection("right");
    else if (info.offset.x < -50) setSwipeDirection("left");
    else setSwipeDirection(null);
  };

  if (!isFront) {
    return (
      <Card className="absolute w-full max-w-[480px] aspect-4/5 rounded-[3rem] overflow-hidden border-slate-100 shadow-card bg-white pointer-events-none select-none scale-[0.96] opacity-30 -z-10 translate-y-6 p-0 gap-0">
        <div className="w-full h-full bg-slate-50/50 flex items-center justify-center">
           <Zap className="text-slate-100" size={120} />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity, scale }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="absolute left-1/2 -translate-x-1/2 w-full max-w-[950px] h-[580px] cursor-grab active:cursor-grabbing z-50 touch-none"
    >
      <Card className="w-full h-full rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-premium bg-white flex flex-col md:flex-row relative group select-none transition-all duration-500 hover:shadow-2xl hover:border-emerald-100 p-0 gap-0">
        {/* Swipe Feedback Overlays */}
        <AnimatePresence>
          {swipeDirection === "right" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center pointer-events-none"
            >
               <motion.div 
                 initial={{ scale: 0.5, rotate: -20 }}
                 animate={{ scale: 1.2, rotate: 0 }}
                 className="bg-emerald-500 text-white p-10 rounded-full shadow-2xl shadow-emerald-500/40"
               >
                  <Heart size={80} fill="currentColor" />
               </motion.div>
            </motion.div>
          )}
          {swipeDirection === "left" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-rose-500/10 backdrop-blur-xs flex items-center justify-center pointer-events-none"
            >
               <motion.div 
                 initial={{ scale: 0.5, rotate: 20 }}
                 animate={{ scale: 1.2, rotate: 0 }}
                 className="bg-rose-500 text-white p-10 rounded-full shadow-2xl shadow-rose-500/40"
               >
                  <X size={80} strokeWidth={3} />
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Section: Branding & Identity (Horizontal Layout) */}
        <div className="relative w-full md:w-[40%] shrink-0 overflow-hidden bg-slate-950 flex flex-col justify-center p-12">
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
                    className="w-full h-full object-contain" 
                    unoptimized 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-display text-6xl font-bold italic">
                    {profile.title[0]}
                  </div>
                )}
              </div>
              <div className="absolute -top-3 -right-3 bg-emerald-500 w-12 h-12 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-lg">
                 <Zap size={20} className="text-white" fill="currentColor" />
              </div>
            </div>

            <div className="space-y-4">
              <Badge className="bg-white/10 backdrop-blur-md text-white border-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                {profile.type === 'job' ? "Opportunità Esclusiva" : "Membro Verificato"}
              </Badge>
              <h2 className="text-white text-4xl font-display font-bold italic tracking-tight leading-tight">{profile.title}</h2>
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Main Content Section */}
        <div className="flex-1 bg-white p-12 flex flex-col gap-10 relative">
          {/* Header */}
          <div className="space-y-2">
            <div className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-600">Dettagli Posizione</div>
            <h3 className="text-5xl font-display font-bold italic text-slate-950 tracking-tight leading-[0.9]">
              {profile.name}
            </h3>
          </div>

          <div className="space-y-8">
            {/* Description Snippet (FULL - NO SCROLL) */}
            {profile.bioShort && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-100 rounded-full" />
                <div className="pl-8">
                  <p className="text-slate-600 text-lg leading-relaxed italic">
                    &quot;{profile.bioShort}&quot;
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requisiti Fondamentali</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 6).map((s) => (
                      <Badge key={s} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold rounded-xl px-3 py-1.5 text-[12px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-l border-slate-50 pl-10 flex flex-col justify-center">
                 <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Budget Proposto</div>
                    <div className="text-slate-950 font-display text-5xl font-bold italic tracking-tighter leading-none">
                      {profile.rate}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-3">Trattabile in base all&apos;esperienza</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Accent (Side for horizontal) */}
        <div className="w-2 shrink-0 bg-linear-to-b from-emerald-400 via-emerald-600 to-slate-900" />
      </Card>
    </motion.div>
  );
}
