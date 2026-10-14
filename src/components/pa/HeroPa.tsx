"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, FileText, Target, Users, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroPaProps {
  onServiceClick?: (service: string) => void;
}

export function HeroPa({ onServiceClick }: HeroPaProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  const dashboardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    },
  };

  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-28">
      <div className="max-w-7xl w-full mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Text Content */}
          <motion.div
            className="lg:col-span-7 space-y-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blu-50 text-chip text-blu-800"
            >
              <Target size={14} className="text-blu" aria-hidden="true" /> Partner tecnologico per la PA
            </motion.div>

            <div className="space-y-6">
              <motion.h1
                variants={itemVariants}
                className="text-display md:text-6xl md:leading-[1.05] font-display font-bold text-viola"
              >
                Helllo per la PA in Puglia: <br />
                <span className="text-blu">Portiamo i NEET al lavoro.</span>
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-xl text-viola-500 leading-relaxed max-w-2xl"
              >
                Siamo il partner tecnologico che aiuta Comuni, Regioni ed enti pugliesi a tracciare il percorso dei giovani invisibili, riducendo il time-to-placement con la rendicontazione già pronta.
              </motion.p>
            </div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={() => {
                  if (onServiceClick) onServiceClick('demo');
                  document.getElementById('contatti')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-14 px-8 gap-3 text-base"
              >
                Richiedi demo operativa <ArrowRight size={20} aria-hidden="true" />
              </Button>
              <Button variant="outline" className="h-14 px-8 gap-3 text-base">
                Scarica scheda tecnica <FileText size={20} aria-hidden="true" />
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-5 pt-2"
            >
              <div className="flex -space-x-3" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-blu-50 flex items-center justify-center">
                    <Users size={16} className="text-blu" />
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                <p className="text-label text-viola-500">Consigliato dai progettisti</p>
                <p className="text-sm font-semibold text-viola">Ideale per bandi FSE+, PNRR e GOL</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard Mockup Content: a flat crema pattern block holding the preview card */}
          <motion.div
            className="lg:col-span-5 relative"
            variants={dashboardVariants}
            initial="hidden"
            animate="visible"
            aria-hidden="true"
          >
            <div className="rounded-[36px] bg-crema bg-[url(/brand/pattern-crema.svg)] bg-cover bg-center p-5 sm:p-8">
            <div className="bg-white rounded-card border border-viola/15 overflow-hidden aspect-square lg:aspect-4/5 relative">
              {/* Browser Header */}
              <div className="h-12 bg-white border-b border-viola/15 flex items-center justify-between px-6">
                 <div className="flex gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-viola-200" />
                   <div className="w-2.5 h-2.5 rounded-full bg-viola-200" />
                   <div className="w-2.5 h-2.5 rounded-full bg-viola-200" />
                 </div>
                 <div className="h-5 w-40 bg-crema rounded-full flex items-center px-3 gap-2">
                    <Search size={10} className="text-viola-400" />
                    <div className="h-1.5 w-full bg-viola-200 rounded-full" />
                 </div>
              </div>

              <div className="p-6 space-y-6 overflow-hidden max-h-full">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-5 bg-blu rounded-3xl space-y-1">
                    <p className="text-label text-blu-100">Presi in carico</p>
                    <div className="flex items-end justify-between">
                      <p className="text-4xl font-display font-bold text-white leading-none">1.284</p>
                      <TrendingUp size={16} className="text-blu-100 mb-1" />
                    </div>
                  </div>
                  <div className="p-5 bg-crema rounded-3xl space-y-1">
                    <p className="text-label text-viola-500">Tirocini</p>
                    <div className="flex items-end justify-between">
                      <p className="text-4xl font-display font-bold text-viola leading-none">342</p>
                      <CheckCircle2 size={16} className="text-viola-500 mb-1" />
                    </div>
                  </div>
                </div>

                {/* Progress Chart Mock */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-sm font-semibold text-viola">Flusso matching</h4>
                    <span className="text-label text-viola-500">Ultimi 30 giorni</span>
                  </div>
                  <div className="h-40 w-full bg-crema rounded-3xl p-5 flex items-end gap-2 justify-between">
                     {[40, 70, 45, 90, 60, 80, 50, 100].map((h, i) => (
                       <motion.div
                        key={i}
                        className={cn("w-full rounded-t-lg", i === 7 ? "bg-blu" : "bg-blu-200")}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1 + i * 0.05, duration: 0.8, ease: "easeOut" }}
                       />
                     ))}
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-3">
                   <h4 className="text-sm font-semibold text-viola px-1">Ultimi onboarding (NEET)</h4>
                   <div className="divide-y divide-viola/15">
                      {[
                        { name: "Marco V.", city: "Bari", status: "Matching" },
                        { name: "Sara L.", city: "Lecce", status: "Tirocinio" },
                        { name: "Giuseppe R.", city: "Taranto", status: "Call" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 px-1">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blu-50 flex items-center justify-center text-xs font-bold text-blu">
                                {item.name.split(' ')[0][0]}
                              </div>
                              <div>
                                 <p className="text-sm font-semibold text-viola leading-none">{item.name}</p>
                                 <p className="text-xs text-viola-500 mt-1">{item.city}</p>
                              </div>
                           </div>
                           <span className={cn(
                             "text-xs font-medium px-2.5 py-0.5 rounded-full",
                             item.status === 'Tirocinio' ? 'bg-rosa text-viola' : 'bg-blu-50 text-blu-800'
                           )}>
                              {item.status}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
            </div>

            {/* Floating Element */}
            <motion.div
              className="absolute -right-4 top-1/4 z-20 p-4 bg-white border border-viola/15 rounded-3xl shadow-card flex items-center gap-3"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
               <div className="w-10 h-10 bg-blu-50 text-blu rounded-full flex items-center justify-center">
                  <BarChart3 size={20} />
               </div>
               <div>
                  <p className="text-label text-viola-500 leading-none">Time to match</p>
                  <p className="text-lg font-bold text-blu leading-tight">-42% <span className="text-xs font-medium text-viola-500">v1</span></p>
               </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
