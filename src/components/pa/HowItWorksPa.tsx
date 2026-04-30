"use client";

import { motion } from "framer-motion";
import { UserPlus, Zap, Rocket, FileCheck } from "lucide-react";

const steps = [
  {
    title: "Onboarding",
    desc: "Il NEET si iscrive alla piattaforma tramite una landing dedicata o segnalazione dell'operatore.",
    icon: UserPlus,
  },
  {
    title: "Matching",
    desc: "L'algoritmo incrocia competenze e attitudini con le ricerche attive delle aziende del territorio.",
    icon: Zap,
  },
  {
    title: "Action",
    desc: "Attivazione del tirocinio o inserimento lavorativo con monitoraggio costante del percorso.",
    icon: Rocket,
  },
  {
    title: "Reporting",
    desc: "Generazione automatica della documentazione tecnica per la rendicontazione dei bandi.",
    icon: FileCheck,
  },
];

export function HowItWorksPa() {
  return (
    <section className="py-32 bg-pa-gray-cold">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-24">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-pa-blue/40">Il Metodo Skillr</h2>
          <p className="text-5xl font-display italic font-bold text-pa-blue leading-tight tracking-tight">
            Dalla presa in carico alla rendicontazione.
          </p>
          <p className="text-lg text-text-secondary">
            Un processo fluido e trasparente che riduce il carico burocratico e massimizza l&apos;efficacia delle politiche attive.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-pa-blue/10 -translate-y-1/2 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-6 text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-white shadow-xl shadow-pa-blue/5 border border-slate-100 flex items-center justify-center mx-auto group-hover:bg-pa-blue group-hover:text-white transition-all duration-500 relative">
                  <step.icon size={32} strokeWidth={1.5} />
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-pa-blue-light text-pa-blue font-black text-[10px] flex items-center justify-center border-2 border-white group-hover:bg-white transition-colors">
                    {i + 1}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display italic font-bold text-pa-blue">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed px-4">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
