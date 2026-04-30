"use client";

import { motion } from "framer-motion";
import { Building2, Landmark, GraduationCap, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const useCases = [
  {
    title: "Comune di Bari",
    type: "Politiche Giovanili",
    scenario: "Attivazione di uno sportello digitale per l'outreach dei NEET 'invisibili'.",
    benefit: "Raggiungimento di 500+ giovani non iscritti ai CPI tramite campagne geolocalizzate.",
    icon: Building2,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "CPI Lecce / ARPAL",
    type: "Centro per l'Impiego",
    scenario: "Automazione del matching tra ricerche attive delle aziende del Salento e profili profilati.",
    benefit: "Riduzione del 40% del tempo medio di presa in carico e primo colloquio.",
    icon: Landmark,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Ambito di Zona Foggia",
    type: "Co-progettazione",
    scenario: "Integrazione di Skillr come partner tecnologico in un bando FSE+ per l'inclusione attiva.",
    benefit: "Rendicontazione automatica dei KPI PNRR richiesta dal bando senza carico manuale.",
    icon: GraduationCap,
    color: "bg-amber-50 text-amber-600",
  },
];

export function UseCasesPuglia() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-pa-blue/40">Scenari di Applicazione</h2>
            <p className="text-5xl font-display italic font-bold text-pa-blue leading-tight tracking-tight">
              Come Skillr trasforma il placement in Puglia.
            </p>
          </div>
          <div className="p-4 bg-pa-gray-warm rounded-2xl border border-pa-blue/5 max-w-sm">
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              * Nota: Questi scenari sono <strong>esempi ipotetici</strong> per illustrare le potenzialità della piattaforma nei contesti istituzionali pugliesi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {useCases.map((useCase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:border-pa-blue/20 hover:shadow-2xl hover:shadow-pa-blue/5 transition-all duration-500 overflow-hidden"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110", useCase.color)}>
                <useCase.icon size={32} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{useCase.type}</span>
                  <h3 className="text-3xl font-display italic font-bold text-pa-blue mt-1">{useCase.title}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-pa-blue/10 transition-colors">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2">Scenario</p>
                    <p className="text-sm text-pa-blue font-medium leading-relaxed italic">"{useCase.scenario}"</p>
                  </div>
                  
                  <div className="flex items-start gap-3 px-1">
                    <ArrowUpRight size={18} className="text-emerald-500 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Impatto Atteso</p>
                      <p className="text-sm text-text-secondary leading-relaxed">{useCase.benefit}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative background number */}
              <div className="absolute -bottom-6 -right-6 text-9xl font-display font-black text-slate-50 select-none pointer-events-none group-hover:text-pa-blue/5 transition-colors">
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
