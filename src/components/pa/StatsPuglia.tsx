"use client";

import { motion } from "framer-motion";


export function StatsPuglia() {
  return (
    <>
      {/* Stats Section - High Impact NEET Data */}
      <section className="bg-slate-900 py-28 text-white relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-1/2" />
        
        <div className="max-w-7xl w-full mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-16 space-y-4"
          >
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">L&apos;Urgenza del Territorio</h2>
            <p className="text-4xl font-serif text-white leading-tight">
              I numeri della crisi NEET in Puglia richiedono un cambio di paradigma tecnologico.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group space-y-6"
            >
              <div className="relative">
                <p className="text-8xl lg:text-9xl font-serif font-black text-white/5 absolute -top-10 -left-4 select-none">23.4</p>
                <p className="text-7xl font-serif font-bold text-white relative">23.4%<sup className="text-xl text-pa-blue-light ml-1">1</sup></p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold italic leading-tight text-white/90">Tasso NEET in Puglia, tra i più alti d&apos;Italia.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Oltre un giovane su quattro non studia e non lavora, un capitale umano disperso che attende risposte concrete.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="group space-y-6"
            >
              <div className="relative">
                <p className="text-8xl lg:text-9xl font-serif font-black text-white/5 absolute -top-10 -left-4 select-none">65</p>
                <p className="text-7xl font-serif font-bold text-white relative">65%<sup className="text-xl text-pa-blue-light ml-1">2</sup></p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold italic leading-tight text-white/90">I &quot;Sommersi&quot; non iscritti ai Centri per l&apos;Impiego.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  La maggior parte dei NEET invisibili sfugge ai canali istituzionali. Skillr Outreach li intercetta dove vivono: online.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
              className="group space-y-6"
            >
              <div className="relative">
                <p className="text-8xl lg:text-9xl font-serif font-black text-white/5 absolute -top-10 -left-4 select-none">4/10</p>
                <p className="text-7xl font-serif font-bold text-white relative">4/10<sup className="text-xl text-pa-blue-light ml-1">3</sup></p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold italic leading-tight text-white/90">Tirocini che falliscono per mancato matching.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Il mismatch tra competenze e offerta genera abbandoni precoci. Il nostro algoritmo garantisce la tenuta del percorso.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sources and Disclaimer */}
          <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] text-white/40 uppercase tracking-widest font-medium">
              <span>1. Fonte: ISTAT Regional Report 2024</span>
              <span>2. Fonte: Elaborazione ANPAL/INAPP 2025</span>
              <span>3. Fonte: Report ADAPT/Inapp su Politiche Attive</span>
            </div>
            <div className="text-[10px] text-pa-blue-light/50 italic">
              * Informazioni soggette ad aggiornamento periodico. Ultimo aggiornamento: Aprile 2026.
            </div>
          </div>
        </div>
      </section>

      {/* Puglia vs Italy Comparison */}
      <section className="py-20 bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Un divario strutturale da colmare.</h3>
              <p className="text-text-secondary leading-relaxed">
                I dati ISTAT evidenziano come la Puglia presenti una sfida sensibilmente più complessa rispetto alla media nazionale, rendendo indispensabili strumenti di matching avanzato.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-px bg-slate-200 rounded-3xl overflow-hidden border border-slate-200"
            >
              <div className="bg-white p-8 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tasso NEET Puglia</p>
                <p className="text-4xl font-serif font-bold text-pa-blue">23.4%</p>
              </div>
              <div className="bg-white p-8 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media Italia</p>
                <p className="text-4xl font-serif font-bold text-slate-300">16.1%</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
