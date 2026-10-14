import { BadgeCheck, Bookmark, Building2, Euro, MapPin, Star, X } from "lucide-react";
import { MockActionBar, MockChip } from "@/components/landing/MockParts";

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
    <section id="fiducia" className="py-20 md:py-32 bg-rosa scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          <div className="space-y-8 md:space-y-10">
            <div className="space-y-5">
              <p className="text-label text-viola">Fiducia</p>
              <h2 className="font-display text-display md:text-6xl md:leading-[1.05] tracking-[-0.03em] text-viola text-balance">
                Sai chi c&apos;è dall&apos;altra{" "}
                <span className="font-script">parte.</span>
              </h2>
              <p className="text-lg text-viola leading-relaxed">
                Cosa trovi su ogni profilo e ogni offerta.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-card bg-white p-6 space-y-3 text-viola">
                  <Icon size={24} strokeWidth={1.75} />
                  <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                  <p className="text-viola-500 leading-relaxed text-sm">{body}</p>
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

/** A candidate card as it appears in the app: blu info block, rosa chips. */
function SampleProfile() {
  return (
    <div className="mx-auto w-full max-w-md" aria-hidden="true">
      <div className="rounded-card overflow-hidden bg-white">
        <div className="flex items-center gap-4 p-6">
          <div className="size-16 shrink-0 rounded-full bg-crema flex items-center justify-center text-2xl font-bold text-viola">
            G
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rosso px-3 h-8 text-xs font-bold text-white">
              <span className="size-1.5 rounded-full bg-white" /> Competenze verificate
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-crema px-3 h-8 text-xs font-semibold text-viola">
              <Star size={12} fill="currentColor" /> 4,9 · 12 recensioni
            </span>
          </div>
        </div>

        <div className="bg-blu px-6 pt-6 pb-7 text-white">
          <p className="flex items-center gap-2 text-title">
            Giulia Bianchi <BadgeCheck size={20} />
          </p>
          <p className="mt-1 text-rosa">UX/UI Designer</p>
          <p className="mt-3 flex items-center gap-2">
            <MapPin size={18} strokeWidth={1.75} className="shrink-0" /> Torino
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Figma", "Design System", "User Research"].map((skill) => (
              <MockChip key={skill}>{skill}</MockChip>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-white/25">
            <p className="text-[13px] leading-4 font-medium text-crema mb-1">Tariffa</p>
            <p className="font-bold text-lg">€350 / giorno</p>
          </div>
        </div>
      </div>
      <MockActionBar pass={X} save={Bookmark} />
    </div>
  );
}
