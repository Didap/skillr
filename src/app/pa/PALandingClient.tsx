"use client";

import { ArrowRight, Handshake, Megaphone, Users } from "lucide-react";
import { HeroPa } from "@/components/pa/HeroPa";
import { UseCasesPuglia } from "@/components/pa/UseCasesPuglia";
import { KpiSection } from "@/components/pa/KpiSection";
import { HowItWorksPa } from "@/components/pa/HowItWorksPa";
import { EngagementModels } from "@/components/pa/EngagementModels";
import { StatsPuglia } from "@/components/pa/StatsPuglia";
import PaLeadForm from "@/components/pa/PaLeadForm";
import { Button } from "@/components/ui/button";
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
      <section id="servizi" className="py-28 bg-crema scroll-mt-20">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="max-w-3xl space-y-6 mb-16">
            <h2 className="text-display md:text-5xl md:leading-tight font-display font-bold text-viola">
               Soluzioni su misura per il placement istituzionale.
            </h2>
            <p className="text-lg text-viola-500">
               Abbiamo pacchettizzato la nostra tecnologia per rispondere alle esigenze di rendicontazione dei bandi PNRR, FSE+ e GOL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "match",
                title: "Helllo Match",
                desc: "Licenza piattaforma per operatori e dirigenti. Gestione ricerche e matching intelligente per Garanzia Giovani e GOL.",
                tag: "Licenza software",
                icon: Users,
              },
              {
                id: "outreach",
                title: "Helllo Outreach",
                desc: "Campagne digitali geolocalizzate e data-driven per intercettare i NEET invisibili sul territorio pugliese.",
                tag: "Servizio operativo",
                icon: Megaphone,
              },
              {
                id: "codesign",
                title: "Helllo Co-Design",
                desc: "Partner tecnologico per enti e fondazioni. Supporto alla scrittura tecnica e alla rendicontazione dei bandi.",
                tag: "Partnership bando",
                icon: Handshake,
              }
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-card p-8 border border-viola/15 hover:border-blu/40 transition-colors flex flex-col h-full"
              >
                <div className="w-14 h-14 rounded-full bg-blu-50 text-blu flex items-center justify-center mb-8" aria-hidden="true">
                   <s.icon size={26} strokeWidth={1.75} />
                </div>
                <div className="space-y-3 grow">
                  <span className="inline-flex rounded-full bg-blu-50 px-3 py-1 text-label text-blu-800">{s.tag}</span>
                  <h3 className="text-2xl font-display font-bold text-viola tracking-tight">{s.title}</h3>
                  <p className="text-viola-500 leading-relaxed text-balance">
                    {s.desc}
                  </p>
                </div>
                <div className="pt-8">
                  <Button
                    variant="outline"
                    onClick={() => handleServiceClick(s.id)}
                    className="w-full h-12 gap-2 text-sm"
                  >
                     Scopri il servizio <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksPa />

      <EngagementModels />

      {/* CTA / Form Section */}
      <section id="contatti" className="py-24 bg-white relative scroll-mt-20">
        <div className="max-w-7xl w-full mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6 mb-12">
              <h2 className="text-display md:text-5xl md:leading-tight font-display font-bold text-viola">
                 Inizia oggi a fare la differenza.
              </h2>
              <p className="text-lg text-viola-500 max-w-xl mx-auto">
                 Compila il modulo per essere ricontattato da un nostro esperto e scoprire come Helllo può potenziare i tuoi servizi al lavoro.
              </p>
            </div>

            <Suspense fallback={<div className="h-[600px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blu"></div></div>}>
              <PaLeadForm />
            </Suspense>
          </div>
        </div>

        {/* Flat crema band behind the lower half of the form */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-crema z-0" aria-hidden="true" />
      </section>
    </div>
  );
}
