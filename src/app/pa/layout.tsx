import { Metadata } from "next";
import Link from "next/link";
import { Globe, Building2, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Helllo per la Pubblica Amministrazione | Puglia",
  description: "La piattaforma di matching che aiuta Comuni, Regioni ed enti accreditati a portare i NEET a un'esperienza di lavoro reale, con la rendicontazione già pronta.",
  keywords: ["PA", "Puglia", "NEET", "Lavoro", "Matching", "Rendicontazione", "Garanzia Giovani", "GOL"],
};

const navLink = "rounded-full px-1 text-sm font-semibold text-viola hover:text-blu transition-colors";
const footerLink = "rounded-sm text-sm font-medium text-blu-100 hover:text-white underline-offset-4 hover:underline transition-colors focus-visible:outline-white";

export default function PALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-viola">
      {/* Institutional Header */}
      <header className="h-20 border-b border-viola/15 bg-white flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link href="/pa" className="flex items-center gap-3 rounded-full" aria-label="Helllo per la PA, home">
            <Logo className="h-8" title={null} />
            <span className="h-6 w-px bg-viola/15 hidden md:block" aria-hidden="true" />
            <span className="text-label text-viola-500 hidden md:block">per la PA</span>
          </Link>

          <nav aria-label="Sezioni" className="hidden md:flex items-center gap-8">
            <Link href="#servizi" className={navLink}>Servizi</Link>
            <Link href="#funzionamento" className={navLink}>Come funziona</Link>
            <Link href="#contatti" className={navLink}>Contatti</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-full text-label text-viola-500 hover:text-blu transition-colors hidden sm:block">
              Vai al sito Pro
            </Link>
            <Link href="/pa#contatti" className={cn(buttonVariants({ variant: "default" }), "h-10 px-5")}>
              Richiedi demo
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-blu text-white py-20 px-6">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-white/15 pb-16 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <Logo className="h-9 text-white" />
                <span className="text-label text-blu-100">per la PA</span>
              </div>
              <p className="text-blu-100 max-w-md text-sm leading-relaxed">
                Helllo è la piattaforma di matching dedicata all&apos;innovazione sociale e al placement pubblico.
                Sviluppiamo soluzioni tecnologiche per facilitare l&apos;incontro tra talento e opportunità
                nel rispetto dei requisiti di trasparenza e rendicontazione istituzionale.
              </p>
              <div className="flex items-center gap-3 pt-2" aria-hidden="true">
                 <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center">
                    <Globe size={18} className="text-white" />
                 </div>
                 <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center">
                    <Building2 size={18} className="text-white" />
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-label text-white">Documentazione</h2>
              <nav aria-label="Documentazione" className="flex flex-col gap-4">
                <Link href="/pa/dichiarazione-accessibilita" className={footerLink}>Dichiarazione di accessibilità</Link>
                <Link href="/privacy" className={footerLink}>Privacy policy</Link>
                <Link href="/terms" className={footerLink}>Termini e condizioni</Link>
                <Link href="/cookies" className={footerLink}>Cookie policy</Link>
              </nav>
            </div>

            <div className="space-y-6">
              <h2 className="text-label text-white">Contatti istituzionali</h2>
              <div className="text-sm space-y-4">
                <div className="space-y-1">
                  <p className="text-label text-blu-100">Supporto</p>
                  <p className="font-semibold text-white">pa@skillr.it</p>
                </div>
                <div className="space-y-1">
                  <p className="text-label text-blu-100">PEC</p>
                  <p className="font-semibold text-white">skillr@legalmail.it</p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-blu-100">
                   <MapPin size={16} aria-hidden="true" />
                   <span className="text-label">Focus territoriale: Puglia</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-label text-blu-100">
            <p>
              Helllo © 2026 — Partner tecnologico per la Pubblica Amministrazione.
            </p>
            <p>
               Design by Didap SRLS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
