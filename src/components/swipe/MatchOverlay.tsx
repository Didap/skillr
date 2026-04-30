"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import Link from "next/link";

interface MatchOverlayProps {
  profileName: string;
  profileImage?: string;
  onClose: () => void;
  matchId: string;
}

export function MatchOverlay({ profileName, profileImage, onClose, matchId }: MatchOverlayProps) {
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-900/95 backdrop-blur-md p-6"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
        className="text-center"
      >
        <h2 className="font-display text-6xl md:text-8xl italic font-bold text-white mb-8">
          It&apos;s a Match!
        </h2>
        <p className="text-xl text-emerald-100 mb-12">
          Tu e {profileName} vi siete piaciuti.
        </p>

        <div className="flex items-center justify-center gap-6 mb-16">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="w-32 h-32 rounded-full border-4 border-white bg-emerald-800 shadow-2xl"
          />
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="w-32 h-32 rounded-full border-4 border-white bg-slate-800 shadow-2xl overflow-hidden"
          >
             {profileImage ? (
               <img src={profileImage} alt={profileName} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-white/20 font-display text-5xl italic font-bold">
                 {profileName[0]}
               </div>
             )}
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/matches/${matchId}`}>
            <Button className="rounded-full px-8 h-14 text-lg bg-white text-emerald-950 hover:bg-emerald-50 gap-2 w-full sm:w-auto">
              <Calendar size={20} /> Pianifica Call
            </Button>
          </Link>
          <Button variant="outline" onClick={onClose} className="rounded-full px-8 h-14 text-lg border-emerald-700 text-emerald-100 hover:bg-emerald-800 hover:text-white w-full sm:w-auto">
            Continua a cercare
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

