"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Check,
  Heart,
  Sparkles,
  User,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "professional" | "company";

type Step = {
  label: string;
  title: string;
  body: string;
};

const STEPS: Record<Role, Step[]> = {
  professional: [
    {
      label: "Profilo",
      title: "Chi sei e quanto chiedi",
      body: "3 skill, la tua tariffa (al giorno, all'ora o RAL), CV e portfolio. Le competenze le verifichiamo noi.",
    },
    {
      label: "Swipe",
      title: "Offerte con il budget",
      body: "Solo offerte in linea con le tue skill, con il budget in chiaro. Destra ti candidi, sinistra passi. Se un'azienda ti ha messo like, puoi ricambiare.",
    },
    {
      label: "Match",
      title: "Interesse reciproco",
      body: "L'azienda accetta la tua candidatura, o tu ricambi il suo like: è match. Prima, nessuno può scriverti.",
    },
    {
      label: "Call",
      title: "Scegli l'orario",
      body: "L'azienda propone fino a 3 slot da 30 minuti. Ne scegli uno: invito in calendario, link Meet e promemoria. Dopo, recensione reciproca.",
    },
  ],
  company: [
    {
      label: "Profilo",
      title: "Azienda e offerta",
      body: "Partita IVA, logo e dichiarazione di veridicità. Poi l'offerta: skill e budget. Senza budget non si pubblica.",
    },
    {
      label: "Swipe",
      title: "Talenti in una card",
      body: "Skill, tariffa e bio. Destra se ti interessa. Intanto i candidati arrivano dalle tue offerte.",
    },
    {
      label: "Match",
      title: "Accetti o rifiuti",
      body: "Accetti un candidato, o un professionista ricambia il tuo like: è match. Nessuna inbox da gestire.",
    },
    {
      label: "Call",
      title: "Proponi gli orari",
      body: "Fino a 3 slot da 30 minuti. Link Meet automatico, o il tuo Zoom o Teams. L'invito arriva a entrambi.",
    },
  ],
};

const ROLES: { id: Role; label: string; shortLabel: string; icon: typeof User }[] = [
  { id: "professional", label: "Sono un professionista", shortLabel: "Professionista", icon: User },
  { id: "company", label: "Sono un'azienda", shortLabel: "Azienda", icon: Briefcase },
];

export function HowItWorks() {
  const [role, setRole] = useState<Role>("professional");
  const [active, setActive] = useState(0);
  const steps = STEPS[role];

  return (
    <section id="come-funziona" className="py-20 md:py-32 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16 space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rosso-50 text-rosso-700 text-[11px] font-black uppercase tracking-widest border border-rosso-100">
            <Sparkles size={12} /> Come funziona
          </span>
          <h2 className="font-display text-5xl md:text-7xl text-viola-950 leading-tight text-balance">
            Dal profilo alla call, <span className="italic text-rosso-600">in quattro passi.</span>
          </h2>
          <p className="text-lg text-viola-500 font-medium leading-relaxed">
            Stesso percorso, due lati. Scegli il tuo.
          </p>
        </div>

        <div
          role="group"
          aria-label="Scegli il tuo ruolo"
          className="inline-flex p-1.5 mb-14 rounded-full bg-viola-100 border border-viola-200"
        >
          {ROLES.map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              aria-pressed={role === id}
              onClick={() => {
                setRole(id);
                setActive(0);
              }}
              className={cn(
                "inline-flex items-center gap-2 h-12 px-5 sm:px-7 rounded-full text-sm font-bold transition-all",
                role === id
                  ? "bg-viola-950 text-white shadow-lg shadow-viola-300"
                  : "text-viola-500 hover:text-viola-900"
              )}
            >
              <Icon size={16} />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={`${role}-${i}`}>
                <button
                  onClick={() => setActive(i)}
                  aria-current={active === i ? "step" : undefined}
                  className={cn(
                    "w-full text-left rounded-3xl border-2 p-6 sm:p-8 transition-all",
                    active === i
                      ? "border-rosso-500/30 bg-rosso-50/40 shadow-card"
                      : "border-viola-100 hover:border-viola-200"
                  )}
                >
                  <div className="flex items-start gap-5">
                    <span
                      className={cn(
                        "shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center font-display text-2xl transition-colors",
                        active === i ? "bg-rosso-600 text-white" : "bg-viola-100 text-viola-400"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="space-y-2 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-rosso-700">
                        {step.label}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-viola-950 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-viola-500 font-medium leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </button>
                {/* On small screens only the selected step opens its preview, right under it */}
                <AnimatePresence initial={false}>
                  {active === i && (
                    <motion.div
                      key={`${role}-${i}-preview`}
                      className="lg:hidden overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto", transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                    >
                      <div className="pt-4">
                        <PreviewFrame>
                          <StepPreview role={role} step={i} />
                        </PreviewFrame>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ol>

          <div className="hidden lg:block sticky top-32">
            <PreviewFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${role}-${active}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepPreview role={role} step={active} />
                </motion.div>
              </AnimatePresence>
            </PreviewFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[2.5rem] bg-linear-to-b from-rosso-50 to-viola-50 border border-viola-100 p-6 sm:p-12 flex items-center justify-center min-h-[280px] lg:min-h-[480px] overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-rosso-200/40 blur-[100px]" />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}

function StepPreview({ role, step }: { role: Role; step: number }) {
  if (step === 0) return role === "professional" ? <ProfilePreview /> : <JobPostPreview />;
  if (step === 1) return role === "professional" ? <JobCardPreview /> : <TalentCardPreview />;
  if (step === 2) return role === "professional" ? <MatchPreview /> : <ApplicantsPreview />;
  return <SlotsPreview role={role} />;
}

const mockCard = "rounded-3xl bg-white shadow-card p-6";

function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" }) {
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-lg text-[11px] font-bold",
        tone === "emerald" ? "bg-rosso-50 text-rosso-700" : "bg-viola-100 text-viola-600"
      )}
    >
      {children}
    </span>
  );
}

function ProfilePreview() {
  return (
    <div className={mockCard}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-rosso-100 flex items-center justify-center font-display text-2xl text-rosso-700">
          G
        </div>
        <div>
          <p className="font-bold text-viola-950">Giulia Bianchi</p>
          <p className="text-sm text-viola-500 font-medium">UX/UI Designer</p>
        </div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-viola-400 mb-3">Top 3 skill</p>
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip tone="emerald">Figma</Chip>
        <Chip tone="emerald">Design System</Chip>
        <Chip tone="emerald">User Research</Chip>
      </div>
      <div className="flex items-center justify-between pt-5 border-t border-viola-100">
        <span className="text-sm font-semibold text-viola-500">Tariffa</span>
        <span className="font-bold text-viola-950">€350 / giorno</span>
      </div>
    </div>
  );
}

function JobPostPreview() {
  return (
    <div className={mockCard}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-viola-900 text-white flex items-center justify-center font-bold text-sm">
          TS
        </div>
        <div>
          <p className="font-bold text-viola-950 text-sm">Tech Solutions S.r.l.</p>
          <p className="text-xs text-viola-400 font-medium">P.IVA 01234567890</p>
        </div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-viola-400 mb-1">Nuova offerta</p>
      <p className="text-xl font-bold text-viola-950 mb-4">Senior React Developer</p>
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip>React</Chip>
        <Chip>TypeScript</Chip>
        <Chip>Next.js</Chip>
      </div>
      <div className="rounded-2xl bg-viola-50 p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-viola-400 mb-1">
          Budget · obbligatorio
        </p>
        <p className="font-bold text-viola-950">€45.000 – 55.000 RAL</p>
      </div>
    </div>
  );
}

function SwipeButtons() {
  return (
    <div className="flex justify-center gap-6 mt-6">
      <span className="w-14 h-14 rounded-full bg-white shadow-card flex items-center justify-center text-viola-400">
        <X size={24} />
      </span>
      <span className="w-14 h-14 rounded-full bg-rosso-600 shadow-lg shadow-rosso-200 flex items-center justify-center text-white">
        <Heart size={24} fill="currentColor" />
      </span>
    </div>
  );
}

function JobCardPreview() {
  return (
    <div>
      <div className={cn(mockCard, "rotate-[-2deg]")}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-viola-900 text-white flex items-center justify-center font-bold text-sm">
            TS
          </div>
          <div>
            <p className="font-bold text-viola-950 text-sm">Tech Solutions</p>
            <p className="text-xs text-viola-400 font-medium">Milano · Ibrido</p>
          </div>
        </div>
        <p className="text-xl font-bold text-viola-950 mb-4">Product Designer</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip tone="emerald">Figma</Chip>
          <Chip tone="emerald">Design System</Chip>
          <Chip>Prototyping</Chip>
        </div>
        <div className="rounded-2xl bg-rosso-600 text-white p-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-rosso-100 mb-1">
            Budget
          </p>
          <p className="font-bold text-lg">€300 – 400 / giorno</p>
        </div>
      </div>
      <SwipeButtons />
    </div>
  );
}

function TalentCardPreview() {
  return (
    <div>
      <div className={cn(mockCard, "rotate-2")}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-rosso-100 flex items-center justify-center font-display text-2xl text-rosso-700">
            M
          </div>
          <div>
            <p className="font-bold text-viola-950">Mario Rossi</p>
            <p className="text-sm text-viola-500 font-medium">Senior Fullstack Developer</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 mb-5 px-3 py-1 rounded-full bg-rosso-50 text-rosso-700 text-[11px] font-black uppercase tracking-widest">
          <Check size={12} /> Competenze verificate
        </span>
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip>React</Chip>
          <Chip>Node.js</Chip>
          <Chip>PostgreSQL</Chip>
        </div>
        <div className="flex items-center justify-between pt-5 border-t border-viola-100">
          <span className="text-sm font-semibold text-viola-500">Tariffa</span>
          <span className="font-bold text-viola-950">€500 / giorno</span>
        </div>
      </div>
      <SwipeButtons />
    </div>
  );
}

function MatchPreview() {
  return (
    <div className={cn(mockCard, "text-center py-10")}>
      <div className="flex justify-center -space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-rosso-100 border-4 border-white flex items-center justify-center font-display text-2xl text-rosso-700">
          G
        </div>
        <div className="w-16 h-16 rounded-full bg-viola-900 border-4 border-white flex items-center justify-center font-bold text-white">
          TS
        </div>
      </div>
      <p className="font-display text-4xl text-viola-950 mb-2">
        It&apos;s a <span className="italic text-rosso-600">Match!</span>
      </p>
      <p className="text-sm text-viola-500 font-medium mb-8">Tu e Tech Solutions vi siete piaciuti.</p>
      <span className="inline-flex h-12 items-center px-8 rounded-full bg-viola-950 text-white text-sm font-bold">
        Pianifica la call
      </span>
    </div>
  );
}

function ApplicantsPreview() {
  const applicants = [
    { initial: "G", name: "Giulia Bianchi", rate: "€350/gg", accepted: true },
    { initial: "L", name: "Luca Verdi", rate: "€42k RAL", accepted: false },
  ];
  return (
    <div className={mockCard}>
      <p className="text-[11px] font-black uppercase tracking-widest text-viola-400 mb-1">Product Designer</p>
      <p className="font-bold text-viola-950 mb-5">Candidati da valutare</p>
      <div className="space-y-3">
        {applicants.map((a) => (
          <div key={a.name} className="flex items-center gap-3 rounded-2xl bg-viola-50 p-3">
            <div className="w-10 h-10 rounded-xl bg-rosso-100 flex items-center justify-center font-display text-lg text-rosso-700 shrink-0">
              {a.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-viola-950 text-sm truncate">{a.name}</p>
              <p className="text-xs text-viola-400 font-semibold">{a.rate}</p>
            </div>
            {a.accepted ? (
              <span className="inline-flex items-center gap-1 px-3 h-8 rounded-full bg-rosso-600 text-white text-xs font-bold">
                <Heart size={12} fill="currentColor" /> Match
              </span>
            ) : (
              <span className="inline-flex items-center px-3 h-8 rounded-full bg-viola-950 text-white text-xs font-bold">
                Accetta
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotsPreview({ role }: { role: Role }) {
  const slots = ["Mar 14 · 10:00", "Mer 15 · 15:30", "Gio 16 · 11:00"];
  return (
    <div className={mockCard}>
      <p className="font-bold text-viola-950 mb-1">
        {role === "professional" ? "Quando sei disponibile?" : "Proponi fino a 3 slot"}
      </p>
      <p className="text-sm text-viola-500 font-medium mb-5">Call conoscitiva · 30 minuti</p>
      <div className="space-y-2 mb-6">
        {slots.map((slot, i) => (
          <div
            key={slot}
            className={cn(
              "flex items-center justify-between rounded-2xl border-2 px-4 h-12 text-sm font-bold",
              i === 1 ? "border-rosso-500 bg-rosso-50 text-rosso-800" : "border-viola-100 text-viola-600"
            )}
          >
            {slot}
            {i === 1 && <Check size={16} />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-viola-950 text-white p-4">
        <Video size={18} className="text-rosso-400 shrink-0" />
        <p className="text-sm font-semibold">Link Google Meet generato e invito nel calendario</p>
      </div>
    </div>
  );
}
