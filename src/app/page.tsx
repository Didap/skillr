import { Zap, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { SmartInterviews } from "@/components/landing/SmartInterviews";
import { Faq } from "@/components/landing/Faq";

const NAV_LINKS = [
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#fiducia", label: "Fiducia" },
  { href: "/events", label: "Eventi" },
  { href: "#faq", label: "FAQ" },
];

const PILLARS = [
  {
    icon: Eye,
    title: "Il budget si vede",
    body: "Le offerte dicono quanto pagano, i professionisti quanto chiedono. Prima dello swipe.",
  },
  {
    icon: Zap,
    title: "Il contatto è reciproco",
    body: "Un'azienda ti scrive solo se hai detto sì anche tu.",
  },
  {
    icon: Calendar,
    title: "Niente chat",
    body: "Dopo il match, una call di 30 minuti. Tutto qui.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFC] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="font-display text-3xl italic font-bold tracking-tight text-slate-900">
            Skillr<span className="text-emerald-600">.</span>
          </span>
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
                {label}
              </Link>
            ))}
            <Link href="/login" className="text-sm font-semibold text-slate-900 hover:opacity-70 transition-opacity">
              Accedi
            </Link>
            <Link
              href="/onboarding"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-full px-8 h-12 bg-slate-900 text-white hover:bg-emerald-800 transition-all shadow-xl shadow-slate-200"
              )}
            >
              Inizia ora
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-5">
            <Link href="/login" className="pressable px-3 py-3 text-sm font-semibold text-slate-900">
              Accedi
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-bold text-white"
            >
              Inizia ora
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Hero />

        <HowItWorks />

        {/* The "Three Pillars" Section */}
        <section className="py-20 md:py-32 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-5xl md:text-7xl text-slate-950 leading-tight mb-20 max-w-3xl">
              Tre regole <span className="italic text-emerald-600">che non cambiamo.</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-16 md:gap-20">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="group space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Icon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950 tracking-tight">{title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustSection />

        <SmartInterviews />

        <Faq />

        {/* CTA Section */}
        <section className="py-24 md:py-40 bg-[#FDFDFC]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-display text-5xl md:text-7xl text-slate-950 mb-12 leading-tight">
              Pronto per il tuo <br /><span className="italic text-emerald-600 underline underline-offset-8 decoration-emerald-200">prossimo match?</span>
            </h2>
            <Link
              href="/onboarding"
              className="inline-flex h-16 md:h-20 items-center justify-center rounded-full bg-slate-950 px-10 md:px-16 text-lg md:text-xl font-bold text-white transition-all hover:scale-105 hover:bg-emerald-900 shadow-2xl shadow-slate-300"
            >
              Crea il profilo, è gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="font-display text-2xl italic font-bold text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 md:gap-x-12 gap-y-1 md:gap-y-4 text-sm font-bold text-slate-500 [&>a]:py-3 md:[&>a]:py-0">
            <Link href="/pa" className="text-emerald-600 hover:text-emerald-700 transition-colors">Skillr per la PA</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Termini</Link>
            <Link href="/cookies" className="hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
          <p className="text-sm font-medium text-slate-400">
            © 2026 Skillr
          </p>
        </div>
      </footer>
    </div>
  );
}
