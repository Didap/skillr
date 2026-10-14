"use client";


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Info } from "lucide-react";

const kpis = [
  { kpi: "NEET presi in carico", track: "Anagrafica + consenso + timestamp onboarding", icon: true },
  { kpi: "NEET avviati a colloquio", track: "Numero match con call prenotata", icon: true },
  { kpi: "Tirocini attivati", track: "Stato post-call validato dall'operatore", icon: true },
  { kpi: "Tirocini conclusi positivamente", track: "Review bidirezionale certificata", icon: true },
  { kpi: "Trasformazioni in contratto", track: "Follow-up automatico a 6 mesi", icon: true },
  { kpi: "Time-to-placement medio", track: "Δ tra onboarding e prima call di successo", icon: true },
  { kpi: "Copertura territoriale", track: "Mappatura NEET per CAP/Provincia", icon: true },
  { kpi: "Tasso di drop-off per fase", track: "Funnel analitico onboarding → placement", icon: true },
];

export function KpiSection() {
  return (
    <section id="kpi" className="py-28 bg-white">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-label text-blu">Rendicontazione</h2>
              <p className="text-display md:text-4xl md:leading-tight font-display font-bold text-viola">
                I KPI che vincono i bandi.
              </p>
            </div>
            <p className="text-lg text-viola-500 leading-relaxed">
              Helllo traccia nativamente gli indicatori richiesti dai programmi PNRR, GOL e FSE+, eliminando il carico manuale per l&apos;ente.
            </p>

            <div className="p-6 bg-crema rounded-card space-y-3">
              <div className="flex items-center gap-2 text-blu">
                <Info size={20} aria-hidden="true" />
                <span className="text-sm font-semibold text-viola">Nota tecnica</span>
              </div>
              <p className="text-sm text-viola-500 leading-relaxed">
                Tutti i dati sono esportabili in formato CSV/Excel conformemente alle linee guida ANPAL e AGID per la rendicontazione dei servizi al lavoro.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-card border border-viola/15 overflow-hidden">
              <Table>
                <TableHeader className="bg-crema">
                  <TableRow className="hover:bg-transparent border-viola/15">
                    <TableHead className="h-14 px-6 md:px-8 text-label text-viola-500 w-1/2">Indicatore KPI</TableHead>
                    <TableHead className="h-14 px-6 md:px-8 text-label text-viola-500">Tracciamento Helllo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((item, i) => (
                    <TableRow key={i} className="group hover:bg-blu-50/60 transition-colors border-viola/15">
                      <TableCell className="py-5 px-6 md:px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-blu shrink-0" aria-hidden="true" />
                          <span className="font-semibold text-viola text-base">{item.kpi}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-6 md:px-8">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-viola-500">{item.track}</span>
                          <CheckCircle2 size={18} className="text-blu opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
