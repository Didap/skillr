import { BadgeCheck, Building2, Check, Euro, ShieldCheck, Star } from "lucide-react";

const POINTS = [
  {
    icon: Building2,
    title: "Partita IVA",
    body: "Obbligatoria per ogni azienda, con dichiarazione di veridicità dei dati.",
  },
  {
    icon: BadgeCheck,
    title: "Competenze verificate",
    body: "Il badge arriva dopo il controllo di portfolio e GitHub.",
  },
  {
    icon: Euro,
    title: "Budget in chiaro",
    body: "Senza fascia di budget, l'offerta non va online.",
  },
  {
    icon: Star,
    title: "Recensioni dopo la call",
    body: "Da 1 a 5 stelle, in entrambe le direzioni.",
  },
];

export function TrustSection() {
  return (
    <section id="fiducia" className="py-20 md:py-40 bg-slate-950 relative overflow-hidden scroll-mt-20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-24 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> Fiducia
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-white leading-tight">
              Sai chi c&apos;è <br />
              <span className="italic text-emerald-400">dall&apos;altra parte.</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Cosa trovi su ogni profilo e ogni offerta.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                  <p className="text-slate-400 font-medium leading-relaxed text-sm">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <SampleProfile />
        </div>
      </div>
    </section>
  );
}

function SampleProfile() {
  return (
    <div className="relative group" aria-hidden="true">
      <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl group-hover:bg-emerald-500/30 transition-all" />
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center font-display text-2xl text-slate-950">
            G
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white">Giulia Bianchi</p>
            <p className="text-sm text-slate-400 font-medium">UX/UI Designer · Torino</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <Check size={12} /> Competenze verificate
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold">
            <Star size={12} fill="currentColor" className="text-emerald-400" /> 4,9 · 12 recensioni
          </span>
        </div>

        <div className="space-y-3 mb-10">
          {["Figma", "Design System", "User Research"].map((skill) => (
            <div key={skill} className="flex items-center justify-between rounded-2xl bg-slate-800/60 px-4 h-11">
              <span className="text-sm font-semibold text-slate-200">{skill}</span>
              <BadgeCheck size={16} className="text-emerald-400" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tariffa</p>
            <p className="font-bold text-white text-lg">€350 / giorno</p>
          </div>
          <span className="inline-flex h-11 items-center px-6 rounded-full bg-emerald-500 text-slate-950 text-sm font-bold">
            Interessa
          </span>
        </div>
      </div>
    </div>
  );
}
