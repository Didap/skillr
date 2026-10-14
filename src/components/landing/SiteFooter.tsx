import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Termini" },
  { href: "/cookies", label: "Cookies" },
];

/** Public footer (landing, events): viola block, white wordmark, crema links. */
export function SiteFooter({ note, className }: { note: string; className?: string }) {
  return (
    <footer className={cn("bg-viola py-14 md:py-20 text-crema", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
        <Link href="/" aria-label="Helllo, torna alla home" className="rounded-full">
          <Logo title={null} className="h-9 text-white" />
        </Link>
        <div className="flex flex-wrap justify-center gap-x-8 md:gap-x-10 gap-y-1 text-sm font-semibold [&>a]:py-3 md:[&>a]:py-1">
          <Link href="/pa" className="text-rosa underline-offset-4 hover:underline">
            Helllo per la PA
          </Link>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="underline-offset-4 hover:text-white hover:underline">
              {label}
            </Link>
          ))}
        </div>
        <p className="text-sm text-crema/80">{note}</p>
      </div>
    </footer>
  );
}
