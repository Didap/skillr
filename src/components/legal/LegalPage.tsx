"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#FDFDFC] flex flex-col">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center px-10 sticky top-0 z-40">
        <Link 
          href="/" 
          className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="ml-6">
           <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">{title}</h1>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Ultimo aggiornamento: {lastUpdated}</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-10 md:p-20">
        <div className="bg-white border border-slate-50 rounded-[3rem] shadow-premium p-10 md:p-16">
          <div className="legal-content space-y-10 text-slate-600 leading-relaxed font-medium">
            {children}
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-50 text-center">
        <div className="font-display text-2xl italic font-bold text-slate-950 mb-4">
          Skillr<span className="text-emerald-600">.</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">The next-gen matching platform</p>
      </footer>

      <style jsx global>{`
        .legal-content h2 {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 700;
          font-size: 2rem;
          color: #020617;
          letter-spacing: -0.02em;
          margin-top: 4rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f8fafc;
          padding-bottom: 1rem;
        }
        .legal-content h3 {
          font-weight: 800;
          font-size: 1.125rem;
          color: #020617;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .legal-content p {
          margin-bottom: 1.5rem;
        }
        .legal-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 2rem;
          space-y: 0.5rem;
        }
        .legal-content li {
          margin-bottom: 0.5rem;
        }
        .legal-content strong {
          color: #020617;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
