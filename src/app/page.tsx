"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Eye, Calendar, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const containerFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFC] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl italic font-bold tracking-tight text-slate-900">
              Skillr<span className="text-emerald-600">.</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
              Il Modello
            </Link>
            <Link href="#trust" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
              Trasparenza
            </Link>
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
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-40 pb-32 overflow-hidden">
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
                  <Star size={12} fill="currentColor" /> Il Futuro del Recruiting
                </span>
              </motion.div>
              
              <motion.h1 
                variants={itemUp}
                className="font-display text-7xl md:text-9xl leading-[0.9] tracking-tighter text-slate-950 mb-10"
              >
                Trova il match.<br />
                <span className="text-emerald-600 italic">Senza chiacchiere.</span>
              </motion.h1>

              <motion.p 
                variants={itemUp}
                className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed font-medium"
              >
                Il primo marketplace a doppio opt-in che elimina la chat. 
                Vedi le tariffe reali, fai swipe, prenota la call. Semplice.
              </motion.p>

              <motion.div 
                variants={itemUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
              >
                <Link 
                  href="/onboarding" 
                  className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-slate-950 px-10 font-bold text-white transition-all hover:bg-emerald-900 shadow-2xl shadow-slate-300"
                >
                  <span className="mr-2">Voglio assumere</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/onboarding" 
                  className="inline-flex h-16 items-center justify-center rounded-full border-2 border-slate-200 bg-white px-10 font-bold text-slate-900 transition-all hover:border-emerald-600 hover:text-emerald-600"
                >
                  Cerco lavoro
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* The "Three Pillars" Section */}
        <section id="features" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-20">
              <div className="group space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Eye size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight">Trasparenza Radicale</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Le tariffe e le RAL non sono segreti. Su Skillr le vedi prima dello swipe. Niente perdite di tempo in trattative inutili.
                </p>
              </div>

              <div className="group space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight">Doppio Opt-in</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Il contatto avviene solo se l&apos;interesse è reciproco. Un sistema pulito che protegge la tua inbox e la tua attenzione.
                </p>
              </div>

              <div className="group space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Calendar size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight">Zero Chat Loop</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Abbiamo abolito la chat. Dopo il match, il sistema ti propone direttamente degli slot. Match {"->"} Call {"->"} Decisione.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Section */}
        <section id="trust" className="py-40 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[120px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px] -z-10" />
          
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-24 items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} /> Trust Framework
                </div>
                <h2 className="font-display text-5xl md:text-7xl text-white leading-tight">
                  La qualità è un <br /><span className="italic text-emerald-400">obbligo.</span>
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  Skillr non è un catalogo infinito. È una selezione di professionisti e aziende che hanno superato i nostri test di serietà.
                </p>
                
                <div className="space-y-6">
                  {[
                    "Verifica automatica della P.IVA via API camerale",
                    "Certificazione delle competenze via Portfolio/GitHub",
                    "Sistema di review sbloccabile solo post-call reale"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 text-white font-semibold">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                        <ArrowRight size={14} />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl group-hover:bg-emerald-500/30 transition-all" />
                <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-emerald-500" />
                      <div>
                         <div className="h-3 w-32 bg-slate-800 rounded-full mb-2" />
                         <div className="h-2 w-20 bg-slate-800/50 rounded-full" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="h-4 w-full bg-slate-800 rounded-full" />
                      <div className="h-4 w-full bg-slate-800 rounded-full" />
                      <div className="h-4 w-3/4 bg-slate-800 rounded-full" />
                   </div>
                   <div className="mt-12 flex justify-between">
                      <div className="h-10 w-24 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
                      <div className="h-10 w-24 bg-emerald-500 rounded-full" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 bg-[#FDFDFC]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-display text-5xl md:text-7xl text-slate-950 mb-12 leading-tight">
              Pronto per il tuo <br /><span className="italic text-emerald-600 underline underline-offset-8 decoration-emerald-200">prossimo match?</span>
            </h2>
            <Link 
              href="/onboarding" 
              className="inline-flex h-20 items-center justify-center rounded-full bg-slate-950 px-16 text-xl font-bold text-white transition-all hover:scale-105 hover:bg-emerald-900 shadow-2xl shadow-slate-300"
            >
              Crea il tuo profilo gratuito
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="font-display text-2xl italic font-bold text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </div>
          <div className="flex gap-12 text-sm font-bold text-slate-400">
            <Link href="/pa" className="text-emerald-600 hover:text-emerald-700 transition-colors">Skillr per la PA</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Termini</Link>
            <Link href="/cookies" className="hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
          <p className="text-sm font-medium text-slate-400">
            © 2026 Skillr. Built with precision.
          </p>
        </div>
      </footer>
    </div>
  );
}
