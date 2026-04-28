"use client";

import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, X, Heart, Info, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  title: string;
  rate: string;
  location: string;
  skills: string[];
  image?: string;
  bioShort?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  isFront?: boolean;
}

export function SwipeCard({ profile, onSwipe, isFront = false }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);
  const controls = useAnimation();

  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 100) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe("right");
    } else if (info.offset.x < -100) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe("left");
    } else {
      controls.start({ x: 0, rotate: 0, scale: 1 });
    }
    setSwipeDirection(null);
  };

  const handleDrag = (_: any, info: any) => {
    if (info.offset.x > 50) setSwipeDirection("right");
    else if (info.offset.x < -50) setSwipeDirection("left");
    else setSwipeDirection(null);
  };

  if (!isFront) {
    return (
      <Card className="absolute w-full max-w-[400px] aspect-4/5 rounded-[2.5rem] overflow-hidden border-border-subtle shadow-card bg-white pointer-events-none select-none scale-[0.98] opacity-40 -z-10 translate-y-4">
        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
           <Zap className="text-slate-100" size={80} />
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
      className="absolute w-full max-w-[400px] aspect-4/5 cursor-grab active:cursor-grabbing z-50"
    >
      <Card className="w-full h-full rounded-[2.5rem] overflow-hidden border-border-subtle shadow-premium bg-white flex flex-col relative group select-none">
        {/* Indicators Overlay */}
        <AnimatePresence>
          {swipeDirection === "right" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-emerald-500/10 flex items-center justify-center pointer-events-none"
            >
               <div className="bg-emerald-500 text-white p-6 rounded-full shadow-2xl shadow-emerald-500/40">
                  <Heart size={48} fill="currentColor" />
               </div>
            </motion.div>
          )}
          {swipeDirection === "left" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-red-500/10 flex items-center justify-center pointer-events-none"
            >
               <div className="bg-red-500 text-white p-6 rounded-full shadow-2xl shadow-red-500/40">
                  <X size={48} />
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - Image or Initials */}
        <div className="relative h-3/5 bg-slate-900 overflow-hidden">
          {profile.image ? (
            <img src={profile.image} alt={profile.name} className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-600 via-emerald-800 to-slate-900">
               <span className="text-white/10 font-display text-[12rem] italic font-black absolute -bottom-10 -right-10 pointer-events-none uppercase">
                 {profile.name[0]}
               </span>
               <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-4xl font-display italic font-bold">
                  {profile.name[0]}
               </div>
            </div>
          )}
          
          <div className="absolute top-6 left-6 flex gap-2">
             <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 text-[10px] font-bold uppercase tracking-wider">
                Verificato
             </Badge>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-slate-950/90 to-transparent text-white">
            <h2 className="text-4xl font-display font-bold italic tracking-tight">{profile.name}</h2>
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mt-1">{profile.title}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col justify-between flex-1">
          <div className="space-y-4">
             <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold rounded-lg h-7">
                    {s}
                  </Badge>
                ))}
                {profile.skills.length > 3 && (
                  <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold rounded-lg h-7">
                    +{profile.skills.length - 3}
                  </Badge>
                )}
             </div>
             
             {profile.bioShort && (
               <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 italic">
                 "{profile.bioShort}"
               </p>
             )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <MapPin size={14} className="text-emerald-500" />
              <span>{profile.location}</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Rate</span>
               <div className="text-slate-950 font-display text-2xl font-bold italic -mt-1">
                 {profile.rate}
               </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
