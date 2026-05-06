"use client";

import { ArrowRight } from "lucide-react";
import { HeroPa } from "@/components/pa/HeroPa";
import { UseCasesPuglia } from "@/components/pa/UseCasesPuglia";
import { KpiSection } from "@/components/pa/KpiSection";
import { HowItWorksPa } from "@/components/pa/HowItWorksPa";
import { EngagementModels } from "@/components/pa/EngagementModels";
import { StatsPuglia } from "@/components/pa/StatsPuglia";
import PaLeadForm from "@/components/pa/PaLeadForm";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function PALandingClient() {
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
      <HeroPa onServiceClick={handleServiceClick} />

      <StatsPuglia />


      <UseCasesPuglia />

      <KpiSection />

      {/* Services Section */}
      <section id="servizi" className="py-32 bg-slate-50">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="max-w-3xl space-y-6 mb-20">
            <h2 className="text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight">
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
                tag: "Licenza Software"
              },
              {
                id: "outreach",
                title: "Skillr Outreach",
                desc: "Campagne digitali geolocalizzate e data-driven per intercettare i NEET invisibili sul territorio pugliese.",
                tag: "Servizio Operativo"
              },
              {
                id: "codesign",
                title: "Skillr Co-Design",
                desc: "Partner tecnologico per enti e fondazioni. Supporto alla scrittura tecnica e alla rendicontazione dei bandi.",
                tag: "Partnership Bando"
              }
            ].map((s, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-[2rem] p-10 border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-pa-blue/20 transition-all duration-500 flex flex-col h-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-pa-blue/5 text-pa-blue flex items-center justify-center mb-10 group-hover:bg-pa-blue group-hover:text-white transition-all duration-500">
                   <div className="w-8 h-8 bg-current opacity-20 rounded-lg" />
                </div>
                <div className="space-y-4 grow">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-pa-blue rounded-full" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{s.tag}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">{s.title}</h3>
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
              <h2 className="text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight">
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
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-50 z-0" />
      </section>
    </div>
  );
}
