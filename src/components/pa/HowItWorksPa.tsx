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
    <section id="funzionamento" className="py-28 bg-crema scroll-mt-20">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
          <h2 className="text-label text-blu">Il metodo Helllo</h2>
          <p className="text-display md:text-5xl md:leading-tight font-display font-bold text-viola">
            Dalla presa in carico alla rendicontazione.
          </p>
          <p className="text-lg text-viola-500">
            Un processo fluido e trasparente che riduce il carico burocratico e massimizza l&apos;efficacia delle politiche attive.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-viola/15 z-0" aria-hidden="true" />

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-6 text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-white text-blu border border-viola/15 flex items-center justify-center mx-auto group-hover:bg-blu group-hover:text-white transition-colors duration-300 relative">
                  <step.icon size={30} strokeWidth={1.75} aria-hidden="true" />
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-blu text-white font-bold text-xs flex items-center justify-center border-2 border-crema group-hover:bg-white group-hover:text-blu transition-colors" aria-hidden="true">
                    {i + 1}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-viola">{step.title}</h3>
                  <p className="text-sm text-viola-500 leading-relaxed px-4">
                    {step.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
