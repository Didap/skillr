import { PaNewsletterForm } from "@/components/pa/PaNewsletterForm";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Newsletter PA - Helllo",
  description: "Iscriviti alla newsletter quindicinale di Helllo per la Pubblica Amministrazione. Ricevi aggiornamenti su bandi NEET, politiche attive e opportunità in Puglia.",
};

export default function PaNewsletterPage() {
  return (
    <div className="min-h-screen bg-crema py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex justify-between items-center gap-4">
          <Link href="/pa" className="group inline-flex items-center rounded-full text-sm font-semibold text-viola-500 hover:text-blu transition-colors">
            <span className="mr-3 h-9 w-9 rounded-full border border-viola/15 bg-white flex items-center justify-center" aria-hidden="true">
              <ArrowLeft className="h-4 w-4" />
            </span>
            Torna alla Home PA
          </Link>
          <span className="px-3 py-1 bg-white rounded-full text-label text-viola">Canale istituzionale</span>
        </div>

        <div className="bg-white rounded-card overflow-hidden border border-viola/15">
          <div className="grid grid-cols-1 lg:grid-cols-5">

            {/* Left Column - Information (2/5) */}
            <div className="lg:col-span-2 bg-blu text-white p-8 md:p-12 flex flex-col justify-between">
              <div>
                <div className="h-14 w-14 rounded-full border border-white/30 flex items-center justify-center mb-8" aria-hidden="true">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-title md:text-4xl md:leading-[1.1] font-display font-bold mb-6">
                  L&apos;impatto dei NEET in Puglia
                </h1>
                <p className="text-blu-100 text-lg mb-10 leading-relaxed">
                  Resta aggiornato sui bandi in uscita e sulle strategie di inclusione lavorativa per il territorio pugliese.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  "Focus su Bandi PNRR e FSE+",
                  "Statistiche territoriali NEET",
                  "Best practice del Terzo Settore"
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <span className="shrink-0 h-2 w-2 rounded-full bg-rosa mr-4" aria-hidden="true" />
                    <span className="text-sm font-medium text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column - Form (3/5) */}
            <div className="lg:col-span-3 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
              <div className="mb-8">
                <h2 className="text-title font-bold text-viola">Iscrizione istituzionale</h2>
                <p className="text-viola-500 mt-4 text-lg leading-relaxed">
                  Inserisci la tua PEC o email istituzionale per attivare il servizio di aggiornamento quindicinale.
                </p>
              </div>

              <div className="bg-crema p-6 md:p-8 rounded-card">
                <PaNewsletterForm />
              </div>

              <div className="mt-8 flex items-center gap-4 py-4 border-t border-viola/15">
                <div className="flex -space-x-2" aria-hidden="true">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-blu-100" />
                  ))}
                </div>
                <p className="text-sm text-viola-500">
                  Unisciti a oltre <span className="text-viola font-bold">120 funzionari</span> già iscritti.
                </p>
              </div>
            </div>

          </div>
        </div>

        <p className="text-center mt-10 text-sm text-viola-500">
          Servizio erogato da <span className="font-bold text-viola">Helllo</span> in collaborazione con gli enti territoriali.
        </p>
      </div>
    </div>
  );
}
