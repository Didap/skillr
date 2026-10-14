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
    <section id="kpi" className="py-32 bg-white">
      <div className="max-w-7xl w-full mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-viola-400">Rendicontazione</h2>
              <p className="text-4xl font-display font-bold text-viola-900 leading-tight tracking-tight">
                I KPI che vincono i bandi.
              </p>
            </div>
            <p className="text-lg text-text-secondary leading-relaxed">
              Helllo traccia nativamente gli indicatori richiesti dai programmi PNRR, GOL e FSE+, eliminando il carico manuale per l&apos;ente.
            </p>
            
            <div className="p-6 bg-crema rounded-[2rem] border border-blu/5 space-y-4">
              <div className="flex items-center gap-3 text-blu">
                <Info size={20} />
                <span className="text-sm font-bold uppercase tracking-widest">Nota Tecnica</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed italic">
                Tutti i dati sono esportabili in formato CSV/Excel conformemente alle linee guida ANPAL e AGID per la rendicontazione dei servizi al lavoro.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] border border-viola-100 shadow-premium overflow-hidden">
              <Table>
                <TableHeader className="bg-crema/50">
                  <TableRow className="hover:bg-transparent border-viola-100">
                    <TableHead className="h-16 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-blu/60 w-1/2">Indicatore KPI</TableHead>
                    <TableHead className="h-16 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-blu/60">Tracciamento Helllo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((item, i) => (
                    <TableRow key={i} className="group hover:bg-blu/2 transition-colors border-viola-50">
                      <TableCell className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-blu opacity-40" />
                          <span className="font-bold text-viola-900 text-lg">{item.kpi}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-8">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-text-secondary font-medium">{item.track}</span>
                          <CheckCircle2 size={18} className="text-rosso-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
