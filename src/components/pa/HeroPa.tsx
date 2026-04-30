"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, FileText, Target, Users, TrendingUp, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function HeroPa() {
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
    <section className="relative overflow-hidden bg-white pt-24 pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-linear-to-b from-pa-gray-warm/30 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-pa-blue/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
      
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
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pa-blue/5 border border-pa-blue/10 text-[10px] font-black uppercase tracking-[0.2em] text-pa-blue"
            >
              <Target size={12} className="text-pa-blue" /> Partner Tecnologico per la PA
            </motion.div>
            
            <div className="space-y-6">
              <motion.h1 
                variants={itemVariants}
                className="text-5xl md:text-7xl font-display italic font-bold text-pa-blue leading-[1.1] tracking-tight"
              >
                Skillr per la PA in Puglia: <br />
                <span className="text-pa-blue/40">Portiamo i NEET al lavoro.</span>
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-xl text-text-secondary leading-relaxed max-w-2xl"
              >
                Siamo il partner tecnologico che aiuta Comuni, Regioni ed enti pugliesi a tracciare il percorso dei giovani invisibili, riducendo il time-to-placement con la rendicontazione già pronta.
              </motion.p>
            </div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => document.getElementById('contatti')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-14 px-8 rounded-full bg-pa-blue text-white font-bold text-lg shadow-xl shadow-pa-blue/20 hover:bg-pa-blue-dark transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Richiedi Demo Operativa <ArrowRight size={20} />
              </button>
              <button className="h-14 px-8 rounded-full bg-white border border-pa-blue/20 text-pa-blue font-bold text-lg hover:bg-pa-gray-warm transition-all flex items-center justify-center gap-3 active:scale-95">
                Scarica Scheda Tecnica <FileText size={20} />
              </button>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-pa-gray-warm flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-pa-blue/10 flex items-center justify-center">
                       <Users size={16} className="text-pa-blue/30" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Consigliato dai progettisti</p>
                <p className="text-xs font-bold text-pa-blue italic">Ideale per bandi FSE+, PNRR e GOL</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard Mockup Content */}
          <motion.div 
            className="lg:col-span-5 relative"
            variants={dashboardVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white rounded-[2.5rem] border border-pa-blue/10 shadow-premium overflow-hidden aspect-square lg:aspect-4/5 relative z-10">
              {/* Browser Header */}
              <div className="h-12 bg-pa-gray-warm border-b border-pa-blue/5 flex items-center justify-between px-6">
                 <div className="flex gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-pa-blue/10" />
                   <div className="w-2.5 h-2.5 rounded-full bg-pa-blue/10" />
                   <div className="w-2.5 h-2.5 rounded-full bg-pa-blue/10" />
                 </div>
                 <div className="h-5 w-48 bg-pa-blue/5 rounded-full flex items-center px-3 gap-2">
                    <Search size={10} className="text-pa-blue/20" />
                    <div className="h-1.5 w-full bg-pa-blue/10 rounded-full" />
                 </div>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar max-h-full pb-20">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-pa-blue/5 rounded-3xl space-y-1 group hover:bg-pa-blue/10 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-widest text-pa-blue/50">Presi in Carico</p>
                    <div className="flex items-end justify-between">
                      <p className="text-4xl font-display italic font-bold text-pa-blue leading-none">1.284</p>
                      <TrendingUp size={16} className="text-pa-blue/40 mb-1" />
                    </div>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-3xl space-y-1 group hover:bg-emerald-100/50 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50">Tirocini</p>
                    <div className="flex items-end justify-between">
                      <p className="text-4xl font-display italic font-bold text-emerald-600 leading-none">342</p>
                      <CheckCircle2 size={16} className="text-emerald-600/40 mb-1" />
                    </div>
                  </div>
                </div>

                {/* Progress Chart Mock */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-xs font-black uppercase tracking-widest text-pa-blue/60">Flusso Matching</h4>
                    <span className="text-[10px] font-bold text-pa-blue/40 italic">Ultimi 30 giorni</span>
                  </div>
                  <div className="h-44 w-full bg-pa-gray-warm rounded-3xl border border-pa-blue/5 p-6 flex items-end gap-2 justify-between">
                     {[40, 70, 45, 90, 60, 80, 50, 100].map((h, i) => (
                       <motion.div 
                        key={i} 
                        className="w-full bg-pa-blue/10 rounded-t-lg relative group"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1 + i * 0.05, duration: 0.8, ease: "easeOut" }}
                       >
                         <div className="absolute inset-0 bg-pa-blue/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                       </motion.div>
                     ))}
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-4">
                   <h4 className="text-xs font-black uppercase tracking-widest text-pa-blue/60 px-1">Ultimi Onboarding (NEET)</h4>
                   <div className="space-y-3">
                      {[
                        { name: "Marco V.", city: "Bari", status: "Matching" },
                        { name: "Sara L.", city: "Lecce", status: "Tirocinio" },
                        { name: "Giuseppe R.", city: "Taranto", status: "Call" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-pa-blue/5 rounded-2xl shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-pa-gray-warm flex items-center justify-center text-[10px] font-bold text-pa-blue">
                                {item.name.split(' ')[0][0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-pa-blue leading-none">{item.name}</p>
                                 <p className="text-[10px] text-text-muted mt-0.5">{item.city}</p>
                              </div>
                           </div>
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                             item.status === 'Tirocinio' ? 'bg-emerald-50 text-emerald-600' : 'bg-pa-blue/5 text-pa-blue/60'
                           )}>
                              {item.status}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              
              {/* Bottom Fade */}
              <div className="absolute bottom-0 left-0 w-full h-20 bg-linear-to-t from-white to-transparent z-20 pointer-events-none" />
            </div>

            {/* Floating Elements */}
            <motion.div 
              className="absolute -right-8 top-1/4 z-20 p-4 bg-white border border-pa-blue/10 rounded-2xl shadow-premium flex items-center gap-3"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
               <div className="w-10 h-10 bg-pa-blue/5 text-pa-blue rounded-xl flex items-center justify-center">
                  <BarChart3 size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-pa-blue/40 leading-none">Time to Match</p>
                  <p className="text-lg font-bold text-pa-blue leading-tight">-42% <span className="text-[10px] text-emerald-600 italic">v1</span></p>
               </div>
            </motion.div>

            {/* Decorative background circle */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-radial from-pa-blue/5 to-transparent rounded-full blur-3xl opacity-30" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
