import { Zap, Eye, MessageCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { SmartInterviews } from "@/components/landing/SmartInterviews";
import { Faq } from "@/components/landing/Faq";
import { SiteFooter } from "@/components/landing/SiteFooter";

const NAV_LINKS = [
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#fiducia", label: "Fiducia" },
  { href: "/events", label: "Eventi" },
  { href: "#faq", label: "FAQ" },
];

// Prompt-card rotation on the viola block: rosa, white, blu (text pairs from DESIGN.md)
const PILLARS = [
  {
    icon: Eye,
    title: "Il budget si vede",
    body: "Le offerte dicono quanto pagano, i professionisti quanto chiedono. Prima dello swipe.",
    card: "bg-rosa text-viola",
    muted: "text-viola",
  },
  {
    icon: Zap,
    title: "Il contatto è reciproco",
    body: "Un'azienda ti scrive solo se hai detto sì anche tu.",
    card: "bg-white text-viola",
    muted: "text-viola-500",
  },
  {
    icon: MessageCircle,
    title: "Chat solo dopo il match",
    body: "Vi scrivete quando vi siete scelti a vicenda, poi una call di 30 minuti.",
    card: "bg-blu text-white",
    muted: "text-crema",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-viola/15 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <Link href="/" aria-label="Helllo, home" className="shrink-0 rounded-full">
            <Logo title={null} className="h-7 md:h-9" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-viola underline-offset-4 decoration-viola/40 hover:underline"
              >
                {label}
              </Link>
            ))}
            <div className="flex items-center gap-3">
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6 text-sm")}>
                Accedi
              </Link>
              <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "h-11 px-6 text-sm")}>
                Inizia ora
              </Link>
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4 text-sm")}>
              Accedi
            </Link>
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "default" }), "h-10 px-5 text-sm")}>
              Inizia ora
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Hero />

        <HowItWorks />

        {/* The "Three Pillars" Section */}
        <section className="py-20 md:py-32 bg-viola">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="font-display text-display md:text-6xl md:leading-[1.05] tracking-[-0.03em] text-white mb-10 md:mb-16 max-w-3xl text-balance">
              Tre regole che non{" "}
              <span className="font-script text-rosa">cambiamo.</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
              {PILLARS.map(({ icon: Icon, title, body, card, muted }) => (
                <div key={title} className={cn("rounded-card p-6 md:p-8 flex flex-col gap-4", card)}>
                  <Icon size={28} strokeWidth={1.75} />
                  <h3 className="font-prompt text-prompt">{title}</h3>
                  {/* Plain template, not cn(): tailwind-merge would read text-body as a colour */}
                  <p className={`text-body ${muted}`}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustSection />

        <SmartInterviews />

        <Faq />

        {/* CTA Section: the brand banner, crema pattern with the wordmark */}
        <section className="py-16 md:py-28 px-4 md:px-6 bg-crema bg-[url(/brand/pattern-crema.svg)] bg-cover bg-center">
          <div className="max-w-2xl mx-auto rounded-[2.25rem] bg-white px-6 py-12 md:px-16 md:py-16 text-center">
            <Logo className="h-12 md:h-16 mx-auto mb-8" />
            <h2 className="font-display text-display md:text-5xl md:leading-[1.1] tracking-[-0.03em] text-viola mb-10 text-balance">
              Pronto per il tuo prossimo{" "}
              <span className="font-script text-rosso">match?</span>
            </h2>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "default" }), "h-14 md:h-16 px-8 md:px-12 text-base md:text-lg")}
            >
              Crea il profilo, è gratis
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter note="© 2026 Helllo" />
    </div>
  );
}
