"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Logo } from "@/components/brand/Logo";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-crema flex flex-col">
      <header className="h-16 md:h-20 border-b border-viola/15 bg-white flex items-center gap-4 px-4 md:px-10 sticky top-0 z-40">
        <Link
          href="/"
          aria-label="Torna alla home"
          className="pressable size-11 shrink-0 rounded-full border border-viola bg-white flex items-center justify-center text-viola hover:bg-crema group"
        >
          <ArrowLeft size={20} strokeWidth={1.75} className="group-hover:-translate-x-0.5 transition-transform motion-reduce:transition-none" />
        </Link>
        <Logo className="h-7 md:h-8" />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 md:px-10 md:py-16">
        <div className="mb-8 md:mb-10 space-y-2">
          <h1 className="font-display text-display md:text-6xl md:leading-[1.05] tracking-[-0.03em] text-viola text-balance">{title}</h1>
          <p className="text-label text-viola-500">Ultimo aggiornamento: {lastUpdated}</p>
        </div>
        <div className="bg-white rounded-card p-6 md:p-14">
          <div className="legal-content text-body md:text-[17px] md:leading-7 text-viola">
            {children}
          </div>
        </div>
      </main>

      <footer className="py-14 md:py-20 bg-viola text-center">
        <Link href="/" aria-label="Helllo, home" className="inline-block rounded-full mb-4">
          <Logo title={null} className="h-9 text-white" />
        </Link>
        <p className="text-label text-crema">The next-gen matching platform</p>
      </footer>

      <style jsx global>{`
    .legal-content > section + section {
     margin-top: 2.5rem;
    }
    .legal-content h2 {
     font-family: var(--font-display);
     font-weight: 700;
     font-size: 1.75rem;
     line-height: 2rem;
     color: var(--color-viola);
     letter-spacing: -0.015em;
     margin-bottom: 1.25rem;
     padding-bottom: 1rem;
     border-bottom: 1px solid var(--color-viola-100);
    }
    .legal-content h3 {
     font-weight: 700;
     font-size: 1.125rem;
     color: var(--color-viola);
     margin-top: 2rem;
     margin-bottom: 0.75rem;
    }
    .legal-content p {
     margin-bottom: 1.25rem;
    }
    .legal-content ul {
     list-style-type: disc;
     padding-left: 1.5rem;
     margin-bottom: 1.5rem;
    }
    .legal-content li {
     margin-bottom: 0.5rem;
    }
    .legal-content li::marker {
     color: var(--color-rosso);
    }
    .legal-content strong {
     color: var(--color-viola);
     font-weight: 700;
    }
   `}</style>
    </div>
  );
}
