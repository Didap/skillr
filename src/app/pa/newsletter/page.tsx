import { PaNewsletterForm } from "@/components/pa/PaNewsletterForm";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Newsletter PA - Skillr",
  description: "Iscriviti alla newsletter quindicinale di Skillr per la Pubblica Amministrazione. Ricevi aggiornamenti su bandi NEET, politiche attive e opportunità in Puglia.",
};

export default function PaNewsletterPage() {
  return (
    <div className="min-h-screen bg-pa-gray-cold relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-pa-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-pa-blue/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-12 flex justify-between items-center">
          <Link href="/pa" className="group inline-flex items-center text-sm font-semibold text-text-secondary hover:text-pa-blue transition-all duration-300">
            <div className="mr-3 h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Torna alla Home PA
          </Link>
          <div className="px-3 py-1 bg-pa-blue/10 rounded-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-pa-blue">Institutional Channel</span>
          </div>
        </div>

        <div className="bg-white shadow-premium rounded-3xl overflow-hidden border border-white/40">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            
            {/* Left Column - Information (2/5) */}
            <div className="lg:col-span-2 bg-pa-blue text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              
              <div className="relative z-10">
                <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold mb-6 leading-[1.1]">
                  L&apos;impatto dei NEET in Puglia
                </h1>
                <p className="text-pa-light/80 text-lg mb-10 leading-relaxed font-medium">
                  Resta aggiornato sui bandi in uscita e sulle strategie di inclusione lavorativa per il territorio pugliese.
                </p>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  "Focus su Bandi PNRR e FSE+",
                  "Statistiche territoriali NEET",
                  "Best practice del Terzo Settore"
                ].map((item, i) => (
                  <div key={i} className="flex items-center group">
                    <div className="shrink-0 h-2 w-2 rounded-full bg-accent group-hover:scale-150 transition-transform duration-300 mr-4" />
                    <p className="text-sm font-semibold tracking-wide text-pa-light/90 uppercase">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Form (3/5) */}
            <div className="lg:col-span-3 p-8 md:p-14 lg:p-20 flex flex-col justify-center bg-white">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-pa-blue tracking-tight">Iscrizione Istituzionale</h2>
                <p className="text-text-secondary mt-4 text-lg leading-relaxed">
                  Inserisci la tua PEC o email istituzionale per attivare il servizio di aggiornamento quindicinale.
                </p>
              </div>
              
              <div className="bg-pa-gray-cold/50 p-8 rounded-2xl border border-pa-gray-cold">
                <PaNewsletterForm />
              </div>
              
              <div className="mt-8 flex items-center gap-4 py-4 border-t border-slate-100">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <p className="text-xs text-text-muted font-medium">
                  Unisciti a oltre <span className="text-pa-blue font-bold">120 funzionari</span> già iscritti.
                </p>
              </div>
            </div>

          </div>
        </div>
        
        <p className="text-center mt-12 text-sm text-text-muted font-medium">
          Servizio erogato da <span className="font-bold text-pa-blue">Skillr</span> in collaborazione con gli enti territoriali.
        </p>
      </div>
    </div>
  );
}
