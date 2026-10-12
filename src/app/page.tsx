"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Zap, Eye, Calendar, Star } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { SmartInterviews } from "@/components/landing/SmartInterviews";
import { Faq } from "@/components/landing/Faq";

const containerFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const NAV_LINKS = [
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#fiducia", label: "Fiducia" },
  { href: "/events", label: "Eventi" },
  { href: "#faq", label: "FAQ" },
];

const PILLARS = [
  {
    icon: Eye,
    title: "Il budget si vede",
    body: "Le offerte dicono quanto pagano, i professionisti quanto chiedono. Prima dello swipe.",
  },
  {
    icon: Zap,
    title: "Il contatto è reciproco",
    body: "Un'azienda ti scrive solo se hai detto sì anche tu.",
  },
  {
    icon: Calendar,
    title: "Niente chat",
    body: "Dopo il match, una call di 30 minuti. Tutto qui.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFC] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="font-display text-3xl italic font-bold tracking-tight text-slate-900">
            Skillr<span className="text-emerald-600">.</span>
          </span>
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
                {label}
              </Link>
            ))}
            <Link href="/login" className="text-sm font-semibold text-slate-900 hover:opacity-70 transition-opacity">
              Accedi
            </Link>
            <Link
              href="/onboarding"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-full px-8 h-12 bg-slate-900 text-white hover:bg-emerald-800 transition-all shadow-xl shadow-slate-200"
              )}
            >
              Inizia ora
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-5">
            <Link href="/login" className="pressable px-3 py-3 text-sm font-semibold text-slate-900">
              Accedi
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-bold text-white"
            >
              Inizia ora
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
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

        <HowItWorks />

        {/* The "Three Pillars" Section */}
        <section className="py-20 md:py-32 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-5xl md:text-7xl text-slate-950 leading-tight mb-20 max-w-3xl">
              Tre regole <span className="italic text-emerald-600">che non cambiamo.</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-16 md:gap-20">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="group space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Icon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950 tracking-tight">{title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustSection />

        <SmartInterviews />

        <Faq />

        {/* CTA Section */}
        <section className="py-24 md:py-40 bg-[#FDFDFC]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-display text-5xl md:text-7xl text-slate-950 mb-12 leading-tight">
              Pronto per il tuo <br /><span className="italic text-emerald-600 underline underline-offset-8 decoration-emerald-200">prossimo match?</span>
            </h2>
            <Link
              href="/onboarding"
              className="inline-flex h-16 md:h-20 items-center justify-center rounded-full bg-slate-950 px-10 md:px-16 text-lg md:text-xl font-bold text-white transition-all hover:scale-105 hover:bg-emerald-900 shadow-2xl shadow-slate-300"
            >
              Crea il profilo, è gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="font-display text-2xl italic font-bold text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 md:gap-x-12 gap-y-1 md:gap-y-4 text-sm font-bold text-slate-500 [&>a]:py-3 md:[&>a]:py-0">
            <Link href="/pa" className="text-emerald-600 hover:text-emerald-700 transition-colors">Skillr per la PA</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Termini</Link>
            <Link href="/cookies" className="hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
          <p className="text-sm font-medium text-slate-400">
            © 2026 Skillr
          </p>
        </div>
      </footer>
    </div>
  );
}
