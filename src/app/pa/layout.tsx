import { Metadata } from "next";
import Link from "next/link";
import { Globe, Building2 } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-pa-blue/10 selection:text-pa-blue">
      {/* Institutional Header */}
      <header className="h-20 border-b border-slate-200 bg-white flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link href="/pa" className="flex items-center gap-3 group">
            <div className="flex items-center">
              <span className="text-3xl font-display font-bold text-pa-blue tracking-tighter">Skillr</span>
              <div className="h-6 w-px bg-slate-200 mx-3 hidden md:block" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hidden md:block mt-1">Settore Pubblico</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#servizi" className="text-sm font-bold text-slate-600 hover:text-pa-blue transition-colors">Servizi</Link>
            <Link href="#funzionamento" className="text-sm font-bold text-slate-600 hover:text-pa-blue transition-colors">Come Funziona</Link>
            <Link href="#contatti" className="text-sm font-bold text-slate-600 hover:text-pa-blue transition-colors">Contatti</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-pa-blue transition-all hidden sm:block">
              Vai al sito Pro
            </Link>
            <button className="h-10 px-6 rounded-full bg-pa-blue text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-pa-blue-dark transition-all transform active:scale-95">
              Richiedi Demo
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-white/5 pb-16 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-display font-bold text-white tracking-tighter">Skillr</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border border-white/10 px-2 py-0.5 rounded">PA Edition</span>
              </div>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                Skillr è la piattaforma di matching dedicata all&apos;innovazione sociale e al placement pubblico. 
                Sviluppiamo soluzioni tecnologiche per facilitare l&apos;incontro tra talento e opportunità 
                nel rispetto dei requisiti di trasparenza e rendicontazione istituzionale.
              </p>
              <div className="flex items-center gap-4 pt-2">
                 <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Globe size={18} className="text-white/40" />
                 </div>
                 <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Building2 size={18} className="text-white/40" />
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Documentazione</h4>
              <nav className="flex flex-col gap-4">
                <Link href="/pa/dichiarazione-accessibilita" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Dichiarazione Accessibilità</Link>
                <Link href="/privacy" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Termini e Condizioni</Link>
                <Link href="/cookies" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Cookie Policy</Link>
              </nav>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Contatti Istituzionali</h4>
              <div className="text-sm space-y-4 text-slate-400">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/20 font-black">Supporto</p>
                  <p className="font-bold text-slate-300">pa@skillr.it</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/20 font-black">PEC</p>
                  <p className="font-bold text-slate-300">skillr@legalmail.it</p>
                </div>
                <div className="pt-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Focus Territoriale: Puglia</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Skillr © 2026 — Partner Tecnologico per la Pubblica Amministrazione.
            </p>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
               Design by Didap SRLS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

