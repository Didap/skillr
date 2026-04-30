import { Metadata } from "next";
import Link from "next/link";
import { Search, Info, Globe, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Skillr per la Pubblica Amministrazione | Puglia",
  description: "La piattaforma di matching che aiuta Comuni, Regioni ed enti accreditati a portare i NEET a un'esperienza di lavoro reale, con la rendicontazione già pronta.",
  keywords: ["PA", "Puglia", "NEET", "Lavoro", "Matching", "Rendicontazione", "Garanzia Giovani", "GOL"],
};

export default function PALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pa-gray-cold flex flex-col font-sans selection:bg-pa-blue/10 selection:text-pa-blue">
      {/* Institutional Header */}
      <header className="h-20 border-b border-pa-blue/10 bg-white/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link href="/pa" className="flex items-center gap-3 group">
            <div className="flex items-center">
              <span className="text-3xl font-display italic font-bold text-pa-blue tracking-tighter">Skillr</span>
              <div className="h-6 w-px bg-pa-blue/20 mx-3 hidden md:block" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-pa-blue/60 hidden md:block mt-1">Per la PA</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#servizi" className="text-sm font-semibold text-pa-blue/70 hover:text-pa-blue transition-colors">Servizi</Link>
            <Link href="#funzionamento" className="text-sm font-semibold text-pa-blue/70 hover:text-pa-blue transition-colors">Come Funziona</Link>
            <Link href="#contatti" className="text-sm font-semibold text-pa-blue/70 hover:text-pa-blue transition-colors">Contatti</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider text-text-muted hover:text-pa-blue transition-all hidden sm:block">
              Vai al sito Pro
            </Link>
            <button className="h-10 px-5 rounded-full bg-pa-blue text-white text-sm font-bold shadow-md hover:bg-pa-blue-dark transition-all transform active:scale-95">
              Richiedi Demo
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-pa-blue text-white py-16 px-6">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-display italic font-bold text-white tracking-tighter">Skillr</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 border border-white/20 px-2 py-0.5 rounded">Per la PA</span>
              </div>
              <p className="text-white/70 max-w-md text-sm leading-relaxed">
                Skillr è un'iniziativa dedicata all'innovazione sociale e al matching occupazionale. 
                Sviluppiamo soluzioni tecnologiche per facilitare l'incontro tra talento e opportunità 
                nel rispetto dei requisiti di trasparenza e rendicontazione della Pubblica Amministrazione.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Link Rapidi</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/pa/dichiarazione-accessibilita" className="text-sm font-medium hover:text-white/80 transition-colors">Dichiarazione di Accessibilità</Link>
                <Link href="/" className="text-sm font-medium hover:text-white/80 transition-colors">Sito Professionisti</Link>
                <Link href="/privacy" className="text-sm font-medium hover:text-white/80 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-sm font-medium hover:text-white/80 transition-colors">Termini e Condizioni</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Contatti</h4>
              <div className="text-sm space-y-2 text-white/70">
                <p>Email: pa@skillr.it</p>
                <p>PEC: skillr@legalmail.it</p>
                <p className="pt-2 italic">Regione di riferimento: Puglia</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Skillr © 2026 — P.IVA 01234567890 — Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-6">
               <Globe size={16} className="text-white/30" />
               <Building2 size={16} className="text-white/30" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
