"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  Check,
  User,
  Video,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";
import { MockActionBar, MockChip } from "@/components/landing/MockParts";
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
      body: "Accetti un candidato, o un professionista ricambia il tuo like: è match. Da lì potete scrivervi.",
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
    <section id="come-funziona" className="py-20 md:py-32 bg-crema scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-3xl mb-10 md:mb-14 space-y-5">
          <p className="text-label text-viola-500">Come funziona</p>
          <h2 className="font-display text-display md:text-6xl md:leading-[1.05] tracking-[-0.03em] text-viola text-balance">
            Dal profilo alla call, in quattro{" "}
            <span className="font-script text-rosso">passi.</span>
          </h2>
          <p className="text-lg text-viola-500 leading-relaxed">
            Stesso percorso, due lati. Scegli il tuo.
          </p>
        </div>

        <div
          role="group"
          aria-label="Scegli il tuo ruolo"
          className="inline-flex p-1 mb-10 md:mb-14 rounded-full bg-white border border-viola"
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
                "pressable inline-flex items-center gap-2 h-12 px-5 sm:px-7 rounded-full text-sm font-semibold text-viola",
                role === id ? "bg-rosa" : "hover:bg-crema"
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={`${role}-${i}`}>
                <button
                  onClick={() => setActive(i)}
                  aria-current={active === i ? "step" : undefined}
                  className={cn(
                    "pressable w-full text-left rounded-card p-5 sm:p-7",
                    active === i
                      ? "bg-viola text-white"
                      : "bg-white text-viola border border-viola/15 hover:border-viola/40"
                  )}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <span
                      className={cn(
                        "shrink-0 size-11 rounded-full flex items-center justify-center text-lg font-bold text-viola",
                        active === i ? "bg-rosa" : "bg-crema"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="space-y-1.5 min-w-0">
                      <p className={cn("text-[13px] leading-4 font-medium", active === i ? "text-rosa" : "text-viola-500")}>
                        {step.label}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{step.title}</h3>
                      <p className={cn("leading-relaxed", active === i ? "text-crema" : "text-viola-500")}>
                        {step.body}
                      </p>
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
                      <div className="pt-3">
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

/** Flat blu block, like the profile screen in the app: white cards sit on it. */
function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-[2.25rem] bg-blu px-4 py-8 sm:p-12 flex items-center justify-center min-h-[280px] lg:min-h-[520px]"
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

function StepPreview({ role, step }: { role: Role; step: number }) {
  if (step === 0) return role === "professional" ? <ProfilePreview /> : <JobPostPreview />;
  if (step === 1) return role === "professional" ? <JobCardPreview /> : <TalentCardPreview />;
  if (step === 2) return role === "professional" ? <MatchPreview /> : <ApplicantsPreview />;
  return <SlotsPreview role={role} />;
}

const mockCard = "rounded-card bg-white p-6 text-viola";
const mockLabel = "text-[13px] leading-4 font-medium text-viola-500";

function Avatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "size-14 shrink-0 rounded-full bg-rosa flex items-center justify-center text-2xl font-bold text-viola",
        className
      )}
    >
      {children}
    </div>
  );
}

function CompanyMark() {
  return (
    <div className="size-10 shrink-0 rounded-full bg-viola text-white flex items-center justify-center font-bold text-sm">
      TS
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className={mockCard}>
      <div className="flex items-center gap-4 mb-6">
        <Avatar>G</Avatar>
        <div>
          <p className="text-lg font-bold">Giulia Bianchi</p>
          <p className="text-sm text-viola-500">UX/UI Designer</p>
        </div>
      </div>
      <p className={cn(mockLabel, "mb-3")}>Top 3 skill</p>
      <div className="flex flex-wrap gap-2 mb-6">
        <MockChip>Figma</MockChip>
        <MockChip>Design System</MockChip>
        <MockChip>User Research</MockChip>
      </div>
      <div className="flex items-center justify-between pt-5 border-t border-viola/15">
        <span className="text-sm text-viola-500">Tariffa</span>
        <span className="font-bold">€350 / giorno</span>
      </div>
    </div>
  );
}

function JobPostPreview() {
  return (
    <div className={mockCard}>
      <div className="flex items-center gap-3 mb-5">
        <CompanyMark />
        <div>
          <p className="font-bold text-sm">Tech Solutions S.r.l.</p>
          <p className="text-xs text-viola-500">P.IVA 01234567890</p>
        </div>
      </div>
      <p className={cn(mockLabel, "mb-1")}>Nuova offerta</p>
      <p className="text-xl font-bold mb-4">Senior React Developer</p>
      <div className="flex flex-wrap gap-2 mb-6">
        <MockChip tone="crema">React</MockChip>
        <MockChip tone="crema">TypeScript</MockChip>
        <MockChip tone="crema">Next.js</MockChip>
      </div>
      <div className="rounded-2xl bg-rosa p-4">
        <p className="text-[13px] leading-4 font-medium mb-1">Budget · obbligatorio</p>
        <p className="font-bold">€45.000 – 55.000 RAL</p>
      </div>
    </div>
  );
}

function JobCardPreview() {
  return (
    <div>
      <div className={mockCard}>
        <div className="flex items-center gap-3 mb-5">
          <CompanyMark />
          <div>
            <p className="font-bold text-sm">Tech Solutions</p>
            <p className="text-xs text-viola-500">Milano · Ibrido</p>
          </div>
        </div>
        <p className="text-xl font-bold mb-4">Product Designer</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <MockChip>Figma</MockChip>
          <MockChip>Design System</MockChip>
          <MockChip tone="crema">Prototyping</MockChip>
        </div>
        <div className="rounded-2xl bg-rosso text-white p-4">
          <p className="text-[13px] leading-4 font-bold mb-1">Budget</p>
          <p className="font-bold text-lg">€300 – 400 / giorno</p>
        </div>
      </div>
      <MockActionBar pass={X} save={Bookmark} />
    </div>
  );
}

function TalentCardPreview() {
  return (
    <div>
      <div className="rounded-card overflow-hidden bg-white">
        <div className="flex flex-wrap items-center gap-3 p-6 pb-5">
          <Avatar>M</Avatar>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rosso px-3 h-8 text-xs font-bold text-white">
            <BadgeCheck size={14} /> Competenze verificate
          </span>
        </div>
        <div className="bg-blu px-6 pt-5 pb-6 text-white">
          <p className="text-xl font-bold">Mario Rossi</p>
          <p className="text-sm text-rosa mb-4">Senior Fullstack Developer</p>
          <div className="flex flex-wrap gap-2 mb-5">
            <MockChip>React</MockChip>
            <MockChip>Node.js</MockChip>
            <MockChip>PostgreSQL</MockChip>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/25">
            <span className="text-sm text-crema">Tariffa</span>
            <span className="font-bold">€500 / giorno</span>
          </div>
        </div>
      </div>
      <MockActionBar pass={X} save={Bookmark} />
    </div>
  );
}

function MatchPreview() {
  return (
    <div className={cn(mockCard, "text-center py-10")}>
      <p className="flex items-end justify-center gap-2 mb-6">
        <span className="text-display">È un</span>
        <Logo title="helllo" className="h-11 mb-0.5" />
      </p>
      <div className="flex items-center justify-center mb-6">
        <Avatar className="size-16 border-4 border-white">G</Avatar>
        <LogoMark className="size-12 -mx-3 relative z-10" />
        <div className="size-16 rounded-full bg-viola border-4 border-white flex items-center justify-center font-bold text-white">
          TS
        </div>
      </div>
      <p className="text-sm text-viola-500 mb-8">Tu e Tech Solutions vi siete scelti a vicenda.</p>
      <span className="inline-flex h-12 items-center px-8 rounded-full bg-rosso text-white text-sm font-bold">
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
      <p className={cn(mockLabel, "mb-1")}>Product Designer</p>
      <p className="font-bold text-lg mb-5">Candidati da valutare</p>
      <div className="space-y-3">
        {applicants.map((a) => (
          <div key={a.name} className="flex items-center gap-3 rounded-2xl bg-crema p-3">
            <Avatar className="size-10 text-lg">{a.initial}</Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{a.name}</p>
              <p className="text-xs text-viola-500">{a.rate}</p>
            </div>
            {a.accepted ? (
              <span className="inline-flex items-center px-3 h-8 rounded-full bg-rosso text-white text-xs font-bold">
                Match
              </span>
            ) : (
              <span className="inline-flex items-center px-3 h-8 rounded-full border border-viola bg-white text-xs font-bold">
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
      <p className="font-bold text-lg mb-1">
        {role === "professional" ? "Quando sei disponibile?" : "Proponi fino a 3 slot"}
      </p>
      <p className="text-sm text-viola-500 mb-5">Call conoscitiva · 30 minuti</p>
      <div className="space-y-2 mb-6">
        {slots.map((slot, i) => (
          <div
            key={slot}
            className={cn(
              "flex items-center justify-between rounded-full px-5 h-12 text-sm font-semibold",
              i === 1 ? "bg-rosa" : "border border-viola/15"
            )}
          >
            {slot}
            {i === 1 && <Check size={16} />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-viola text-white p-4">
        <Video size={18} className="text-rosa shrink-0" />
        <p className="text-sm font-medium">Link Google Meet generato e invito nel calendario</p>
      </div>
    </div>
  );
}
