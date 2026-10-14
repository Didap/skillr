"use client";

import { motion } from "framer-motion";

const stats = [
  {
    value: "23.4%",
    note: "1",
    title: "Tasso NEET in Puglia, tra i più alti d'Italia.",
    desc: "Oltre un giovane su quattro non studia e non lavora, un capitale umano disperso che attende risposte concrete.",
  },
  {
    value: "65%",
    note: "2",
    title: "I \"Sommersi\" non iscritti ai Centri per l'Impiego.",
    desc: "La maggior parte dei NEET invisibili sfugge ai canali istituzionali. Helllo Outreach li intercetta dove vivono: online.",
  },
  {
    value: "4/10",
    note: "3",
    title: "Tirocini che falliscono per mancato matching.",
    desc: "Il mismatch tra competenze e offerta genera abbandoni precoci. Il nostro algoritmo garantisce la tenuta del percorso.",
  },
];

export function StatsPuglia() {
  return (
    <>
      {/* Stats Section - High Impact NEET Data */}
      <section className="bg-blu py-24 text-white">
        <div className="max-w-7xl w-full mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-16 space-y-4"
          >
            <h2 className="text-label text-blu-100">L&apos;urgenza del territorio</h2>
            <p className="text-title md:text-4xl md:leading-tight font-display font-bold text-white">
              I numeri della crisi NEET in Puglia richiedono un cambio di paradigma tecnologico.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 1), duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-5 border-t border-white/25 pt-8"
              >
                <p className="text-6xl lg:text-7xl font-display font-bold tracking-tight text-white">
                  {stat.value}<sup className="text-xl font-bold text-rosa ml-1">{stat.note}</sup>
                </p>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold leading-tight text-white">{stat.title}</h3>
                  <p className="text-blu-100 text-sm leading-relaxed">
                    {stat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sources and Disclaimer */}
          <div className="mt-20 pt-8 border-t border-white/25 flex flex-col md:flex-row justify-between gap-6 text-label text-blu-100">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <span>1. Fonte: ISTAT Regional Report 2024</span>
              <span>2. Fonte: Elaborazione ANPAL/INAPP 2025</span>
              <span>3. Fonte: Report ADAPT/Inapp su Politiche Attive</span>
            </div>
            <div>
              * Informazioni soggette ad aggiornamento periodico. Ultimo aggiornamento: Aprile 2026.
            </div>
          </div>
        </div>
      </section>

      {/* Puglia vs Italy Comparison */}
      <section className="py-20 bg-crema">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-title md:text-3xl font-display font-bold text-viola">Un divario strutturale da colmare.</h3>
              <p className="text-viola-500 leading-relaxed">
                I dati ISTAT evidenziano come la Puglia presenti una sfida sensibilmente più complessa rispetto alla media nazionale, rendendo indispensabili strumenti di matching avanzato.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-white rounded-card p-8 space-y-2">
                <p className="text-label text-viola-500">Tasso NEET Puglia</p>
                <p className="text-4xl font-display font-bold text-blu">23.4%</p>
              </div>
              <div className="bg-white rounded-card p-8 space-y-2">
                <p className="text-label text-viola-500">Media Italia</p>
                <p className="text-4xl font-display font-bold text-viola-500">16.1%</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
