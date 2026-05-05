import { PaNewsletterForm } from "@/components/pa/PaNewsletterForm";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Newsletter PA - Skillr",
  description: "Iscriviti alla newsletter quindicinale di Skillr per la Pubblica Amministrazione. Ricevi aggiornamenti su bandi NEET, politiche attive e opportunità in Puglia.",
};

export default function PaNewsletterPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/pa" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-pa-blue transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Home PA
          </Link>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column - Information */}
            <div className="bg-pa-blue text-white p-8 md:p-12 flex flex-col justify-between">
              <div>
                <Mail className="h-12 w-12 text-white/80 mb-6" />
                <h1 className="text-3xl font-display font-bold mb-4">
                  Resta aggiornato sui Bandi NEET in Puglia
                </h1>
                <p className="text-pa-light/90 text-lg mb-8 leading-relaxed">
                  Iscriviti alla nostra newsletter istituzionale quindicinale. Niente spam, solo informazioni strategiche per chi lavora nelle politiche attive.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <p className="ml-4 text-sm text-pa-light/80">Analisi sulle nuove opportunità di finanziamento (PNRR, GOL).</p>
                </div>
                <div className="flex items-start">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <p className="ml-4 text-sm text-pa-light/80">Dati mensili aggiornati sull&apos;andamento occupazionale giovanile.</p>
                </div>
                <div className="flex items-start">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <p className="ml-4 text-sm text-pa-light/80">Casi d&apos;uso e best practice di digitalizzazione dal Terzo Settore.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pa-blue">Iscriviti ora</h2>
                <p className="text-text-secondary mt-2">
                  Inserisci il tuo indirizzo email istituzionale per ricevere il link di attivazione.
                </p>
              </div>
              
              <PaNewsletterForm />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
