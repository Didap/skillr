"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BadgeCheck, Bookmark, Image as ImageIcon, MapPin, X } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MockActionBar, MockChip } from "@/components/landing/MockParts";
import { cn } from "@/lib/utils";

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
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        <motion.div
          variants={containerFade}
          initial="initial"
          animate="animate"
          className="flex flex-col items-start"
        >
          <motion.p
            variants={itemUp}
            className="mb-6 md:mb-8 inline-flex items-center rounded-full bg-rosa px-4 py-2 text-chip text-viola"
          >
            Recruiting a doppio opt-in
          </motion.p>

          <motion.h1
            variants={itemUp}
            className="font-display text-display sm:text-6xl lg:text-7xl sm:leading-[1.05] lg:leading-[1.05] tracking-[-0.03em] text-viola mb-6 md:mb-8 text-balance"
          >
            Trova il match. Senza{" "}
            <span className="font-script text-rosso">chiacchiere.</span>
          </motion.h1>

          <motion.p
            variants={itemUp}
            className="text-lg md:text-xl text-viola-500 max-w-xl mb-10 md:mb-12 leading-relaxed"
          >
            Vedi quanto paga, fai swipe, scrivi al tuo match e fissi una call di 30 minuti.
          </motion.p>

          <motion.div
            variants={itemUp}
            className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default" }), "group h-14 px-8 text-base gap-2")}
            >
              Voglio assumere
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
            </Link>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "outline" }), "h-14 px-8 text-base")}
            >
              Cerco lavoro
            </Link>
          </motion.div>

          <motion.div variants={itemUp} className="mt-8 md:mt-10">
            <Link
              href="#come-funziona"
              className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-viola underline decoration-viola/40 underline-offset-4 hover:decoration-viola"
            >
              Come funziona <ArrowDown size={16} />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }}
        >
          <HeroCard />
        </motion.div>
      </div>
    </section>
  );
}

/** The discover card from the app, drawn in markup on the rosa brand pattern. */
function HeroCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[2.25rem] bg-rosa bg-[url(/brand/pattern-rosa.svg)] bg-cover bg-center px-5 py-8 sm:p-10 lg:p-12"
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="relative h-36 sm:h-44 rounded-t-card bg-crema flex flex-col items-center justify-center gap-2 text-viola-400">
          <ImageIcon size={28} strokeWidth={1.75} />
          <span className="absolute -bottom-4 left-5 inline-flex items-center gap-2 rounded-full bg-rosso px-4 h-9 text-sm font-bold text-white">
            <span className="size-2 rounded-full bg-white" /> Disponibile da subito
          </span>
        </div>
        <div className="rounded-b-card bg-blu px-5 pt-8 pb-6 sm:px-6 text-white">
          <p className="flex items-center gap-2 text-title">
            Giulia
            <BadgeCheck size={20} strokeWidth={2} className="text-white" />
          </p>
          <p className="mt-1 text-body text-rosa">UX/UI Designer</p>
          <p className="mt-3 font-prompt text-[1.375rem] leading-7 font-medium tracking-[-0.01em] sm:text-prompt">
            Disegno app che si usano senza{" "}
            <span className="font-script text-rosa">manuale.</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-body text-white">
            <MapPin size={18} strokeWidth={1.75} className="shrink-0" />
            Torino · €350 / giorno
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <MockChip>Figma</MockChip>
            <MockChip>Design System</MockChip>
            <MockChip>User Research</MockChip>
          </div>
        </div>
        <MockActionBar pass={X} save={Bookmark} />
      </div>
    </div>
  );
}
