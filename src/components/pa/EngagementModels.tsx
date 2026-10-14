"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Handshake, FileStack, Users2 } from "lucide-react";

const models = [
  {
    title: "Affidamento Diretto",
    desc: "Per acquisti sotto soglia di legge. Procedura rapida ideale per Comuni e piccoli enti.",
    tag: "Rapido",
    icon: ShoppingCart,
  },
  {
    title: "MEPA / Acquisti in Rete",
    desc: "Helllo è presente sul Mercato Elettronico della PA per ordini diretti o trattative.",
    tag: "Standard",
    icon: FileStack,
  },
  {
    title: "Co-progettazione",
    desc: "Collaborazione ex art. 55-56 del Codice Terzo Settore tra PA ed enti non profit.",
    tag: "Strategico",
    icon: Handshake,
  },
  {
    title: "Partnership in ATS",
    desc: "Helllo come partner tecnologico in raggruppamenti temporanei per bandi complessi.",
    tag: "Collaborativo",
    icon: Users2,
  },
];

export function EngagementModels() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-label text-blu">Flessibilità contrattuale</h2>
            <p className="text-display md:text-5xl md:leading-tight font-display font-bold text-viola">
              Come collaborare con noi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {models.map((model, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="p-8 rounded-card bg-crema flex flex-col h-full"
            >
              <div className="w-12 h-12 rounded-full bg-white text-blu flex items-center justify-center mb-8" aria-hidden="true">
                <model.icon size={22} strokeWidth={1.75} />
              </div>
              <div className="space-y-4 grow">
                <div className="inline-flex px-3 py-1 rounded-full bg-white text-label text-viola">
                  {model.tag}
                </div>
                <h3 className="text-2xl font-display font-bold text-viola leading-tight">{model.title}</h3>
                <p className="text-sm text-viola-500 leading-relaxed">
                  {model.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
