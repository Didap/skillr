"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

const containerFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

/** Landing hero: the only part of the page that needs client JS (the staggered entrance). */
export function Hero() {
  return (
    <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-linear-to-b from-emerald-50/50 to-transparent -z-10 rounded-[100%]" />

      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.div
          variants={containerFade}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center"
        >
          <motion.div variants={itemUp} className="mb-10">
            <span className="px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
              <Star size={12} fill="currentColor" /> Recruiting a doppio opt-in
            </span>
          </motion.div>

          <motion.h1
            variants={itemUp}
            className="font-display text-6xl sm:text-7xl md:text-9xl leading-[0.9] tracking-tighter text-slate-950 mb-10"
          >
            Trova il match.<br />
            <span className="text-emerald-600 italic">Senza chiacchiere.</span>
          </motion.h1>

          <motion.p
            variants={itemUp}
            className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed font-medium"
          >
            Vedi quanto paga, fai swipe, fissi una call di 30 minuti. La chat non c&apos;è.
          </motion.p>

          <motion.div
            variants={itemUp}
            className="w-full max-w-sm sm:max-w-none flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6"
          >
            <Link
              href="/onboarding"
              className="pressable group relative inline-flex w-full sm:w-auto h-16 items-center justify-center overflow-hidden rounded-full bg-slate-950 px-10 font-bold text-white transition-all hover:bg-emerald-900 shadow-2xl shadow-slate-300"
            >
              <span className="mr-2">Voglio assumere</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/onboarding"
              className="pressable inline-flex w-full sm:w-auto h-16 items-center justify-center rounded-full border-2 border-slate-200 bg-white px-10 font-bold text-slate-900 transition-all hover:border-emerald-600 hover:text-emerald-600"
            >
              Cerco lavoro
            </Link>
          </motion.div>

          <motion.div variants={itemUp} className="mt-14">
            <Link
              href="#come-funziona"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
            >
              Come funziona <ArrowDown size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
