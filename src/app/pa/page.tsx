"use client";

import { ArrowRight, Zap, Megaphone, Handshake } from "lucide-react";
import { HeroPa } from "@/components/pa/HeroPa";
import { UseCasesPuglia } from "@/components/pa/UseCasesPuglia";
import { KpiSection } from "@/components/pa/KpiSection";
import { HowItWorksPa } from "@/components/pa/HowItWorksPa";
import { EngagementModels } from "@/components/pa/EngagementModels";
import PaLeadForm from "@/components/pa/PaLeadForm";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function PALandingPage() {
  const router = useRouter();

  const handleServiceClick = (service: string) => {
    router.push(`/pa?service=${service}#contatti`, { scroll: false });
    const element = document.getElementById("contatti");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col">
      <HeroPa />

      {/* Stats Section - High Impact NEET Data */}
      <section className="bg-pa-blue py-28 text-white relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-1/2" />
        
        <div className="max-w-7xl w-full mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-16 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-pa-blue-light/80">L&apos;Urgenza del Territorio</h2>
            <p className="text-3xl font-display italic font-medium leading-tight">
              I numeri della crisi NEET in Puglia richiedono un cambio di paradigma tecnologico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <div className="group space-y-6">
              <div className="relative">
                <p className="text-8xl lg:text-9xl font-display italic font-black text-white/10 absolute -top-10 -left-4 select-none group-hover:text-pa-blue-light/20 transition-colors duration-500">23.4</p>
                <p className="text-7xl font-display italic font-bold text-white relative">23.4%<sup className="text-xl text-pa-blue-light ml-1">1</sup></p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold italic leading-tight text-white/90">Tasso NEET in Puglia, tra i più alti d&apos;Italia.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Oltre un giovane su quattro non studia e non lavora, un capitale umano disperso che attende risposte concrete.
                </p>
              </div>
            </div>

            <div className="group space-y-6">
              <div className="relative">
                <p className="text-8xl lg:text-9xl font-display italic font-black text-white/10 absolute -top-10 -left-4 select-none group-hover:text-pa-blue-light/20 transition-colors duration-500">65</p>
                <p className="text-7xl font-display italic font-bold text-white relative">65%<sup className="text-xl text-pa-blue-light ml-1">2</sup></p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold italic leading-tight text-white/90">I &quot;Sommersi&quot; non iscritti ai Centri per l&apos;Impiego.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  La maggior parte dei NEET invisibili sfugge ai canali istituzionali. Skillr Outreach li intercetta dove vivono: online.
                </p>
              </div>
            </div>

            <div className="group space-y-6">
              <div className="relative">
                <p className="text-8xl lg:text-9xl font-display italic font-black text-white/10 absolute -top-10 -left-4 select-none group-hover:text-pa-blue-light/20 transition-colors duration-500">4/10</p>
                <p className="text-7xl font-display italic font-bold text-white relative">4/10<sup className="text-xl text-pa-blue-light ml-1">3</sup></p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold italic leading-tight text-white/90">Tirocini che falliscono per mancato matching.</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Il mismatch tra competenze e offerta genera abbandoni precoci. Il nostro algoritmo garantisce la tenuta del percorso.
                </p>
              </div>
            </div>
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
      <section className="py-20 bg-pa-gray-warm border-b border-pa-blue/5">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-display italic font-bold text-pa-blue">Un divario strutturale da colmare.</h3>
              <p className="text-text-secondary leading-relaxed">
                I dati ISTAT evidenziano come la Puglia presenti una sfida sensibilmente più complessa rispetto alla media nazionale, rendendo indispensabili strumenti di matching avanzato.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-pa-blue/10 rounded-3xl overflow-hidden border border-pa-blue/10">
              <div className="bg-white p-8 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tasso NEET Puglia</p>
                <p className="text-4xl font-display italic font-bold text-pa-blue">23.4%</p>
              </div>
              <div className="bg-white p-8 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media Italia</p>
                <p className="text-4xl font-display italic font-bold text-slate-300">16.1%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <UseCasesPuglia />

      <KpiSection />

      {/* Services Section */}
      <section id="servizi" className="py-32 bg-pa-gray-cold">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="max-w-2xl space-y-6 mb-20">
            <h2 className="text-5xl font-display italic font-bold text-pa-blue leading-tight tracking-tight">
               Soluzioni su misura per il placement istituzionale.
            </h2>
            <p className="text-lg text-text-secondary">
               Abbiamo pacchettizzato la nostra tecnologia per rispondere alle esigenze di rendicontazione dei bandi PNRR, FSE+ e GOL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: "match",
                title: "Skillr Match",
                desc: "Licenza piattaforma per operatori e dirigenti. Gestione ricerche e matching intelligente per Garanzia Giovani e GOL.",
                icon: Zap,
                tag: "Licenza Software"
              },
              {
                id: "outreach",
                title: "Skillr Outreach",
                desc: "Campagne digitali geolocalizzate e data-driven per intercettare i NEET invisibili sul territorio pugliese.",
                icon: Megaphone,
                tag: "Servizio Operativo"
              },
              {
                id: "codesign",
                title: "Skillr Co-Design",
                desc: "Partner tecnologico per enti e fondazioni. Supporto alla scrittura tecnica e alla rendicontazione dei bandi.",
                icon: Handshake,
                tag: "Partnership Bando"
              }
            ].map((s, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-[2rem] p-10 border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-pa-blue/20 transition-all duration-500 flex flex-col h-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-pa-blue/5 text-pa-blue flex items-center justify-center mb-10 group-hover:bg-pa-blue group-hover:text-white transition-all duration-500">
                   <s.icon size={32} strokeWidth={1.5} />
                </div>
                <div className="space-y-4 grow">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-pa-blue-light rounded-full" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-pa-blue/40">{s.tag}</span>
                  </div>
                  <h3 className="text-3xl font-display italic font-bold text-pa-blue tracking-tight">{s.title}</h3>
                  <p className="text-text-secondary leading-relaxed text-balance">
                    {s.desc}
                  </p>
                </div>
                <div className="pt-10">
                  <button 
                    onClick={() => handleServiceClick(s.id)}
                    className="w-full h-14 rounded-xl border border-pa-blue/10 text-pa-blue font-bold text-sm flex items-center justify-center gap-3 group-hover:bg-pa-blue group-hover:text-white group-hover:border-pa-blue transition-all duration-300"
                  >
                     Scopri il servizio <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksPa />

      <EngagementModels />

      {/* CTA / Form Section */}
      <section id="contatti" className="py-24 bg-white relative">
        <div className="max-w-7xl w-full mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-5xl font-display italic font-bold text-pa-blue leading-tight tracking-tight">
                 Inizia oggi a fare la differenza.
              </h2>
              <p className="text-lg text-text-secondary max-w-xl mx-auto">
                 Compila il modulo per essere ricontattato da un nostro esperto e scoprire come Skillr può potenziare i tuoi servizi al lavoro.
              </p>
            </div>
            
            <Suspense fallback={<div className="h-[600px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pa-blue"></div></div>}>
              <PaLeadForm />
            </Suspense>
          </div>
        </div>

        {/* Decorative background pattern */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-pa-gray-cold/50 z-0" />
      </section>
    </div>
  );
}
