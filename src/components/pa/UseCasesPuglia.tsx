"use client";

import { motion } from "framer-motion";
import { Building2, Landmark, GraduationCap, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const useCases = [
  {
    title: "Comune di Bari",
    type: "Politiche giovanili",
    scenario: "Attivazione di uno sportello digitale per l'outreach dei NEET 'invisibili'.",
    benefit: "Raggiungimento di 500+ giovani non iscritti ai CPI tramite campagne geolocalizzate.",
    icon: Building2,
    color: "bg-blu-50 text-blu",
  },
  {
    title: "CPI Lecce / ARPAL",
    type: "Centro per l'Impiego",
    scenario: "Automazione del matching tra ricerche attive delle aziende del Salento e profili profilati.",
    benefit: "Riduzione del 40% del tempo medio di presa in carico e primo colloquio.",
    icon: Landmark,
    color: "bg-crema text-viola",
  },
  {
    title: "Ambito di Zona Foggia",
    type: "Co-progettazione",
    scenario: "Integrazione di Helllo come partner tecnologico in un bando FSE+ per l'inclusione attiva.",
    benefit: "Rendicontazione automatica dei KPI PNRR richiesta dal bando senza carico manuale.",
    icon: GraduationCap,
    color: "bg-rosa text-viola",
  },
];

export function UseCasesPuglia() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-label text-blu">Scenari di applicazione</h2>
            <p className="text-display md:text-5xl md:leading-tight font-display font-bold text-viola">
              Come Helllo trasforma il placement in Puglia.
            </p>
          </div>
          <div className="p-4 bg-crema rounded-3xl max-w-sm">
            <p className="text-label text-viola-500 leading-relaxed">
              * Nota: questi scenari sono <strong className="font-semibold text-viola">esempi ipotetici</strong> per illustrare le potenzialità della piattaforma nei contesti istituzionali pugliesi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((useCase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white border border-viola/15 rounded-card p-8 hover:border-blu/40 transition-colors"
            >
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-8", useCase.color)} aria-hidden="true">
                <useCase.icon size={26} strokeWidth={1.75} />
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-label text-viola-500">{useCase.type}</span>
                  <h3 className="text-2xl font-display font-bold text-viola mt-1">{useCase.title}</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-crema rounded-3xl">
                    <p className="text-label text-viola-500 mb-2">Scenario</p>
                    <p className="text-sm text-viola font-medium leading-relaxed">{useCase.scenario}</p>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <ArrowUpRight size={18} className="text-blu shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-label text-viola-500 mb-1">Impatto atteso</p>
                      <p className="text-sm text-viola leading-relaxed">{useCase.benefit}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
