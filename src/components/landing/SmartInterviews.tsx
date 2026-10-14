import Link from "next/link";
import { ArrowRight, CalendarPlus, Sparkles, Ticket, Video } from "lucide-react";
import { LandingEvents } from "@/components/landing/LandingEvents";

const STEPS = [
  {
    icon: CalendarPlus,
    title: "L'azienda apre una sessione",
    body: "Data, formato, skill cercate, posti disponibili.",
  },
  {
    icon: Ticket,
    title: "Prenoti un posto",
    body: "Un clic. Il link arriva via email.",
  },
  {
    icon: Video,
    title: "Ti colleghi",
    body: "Call brevi con il team che assume.",
  },
];

export function SmartInterviews() {
  return (
    <section id="smart-interview" className="py-20 md:py-32 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rosso-50 text-rosso-600 text-[11px] font-black uppercase tracking-widest border border-rosso-100">
              <Sparkles size={12} /> Eventi
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-viola-950 leading-tight">
              Smart <span className="italic text-rosso-600">Interview.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-6 items-start md:items-end">
            <p className="text-viola-500 max-w-md font-medium text-lg md:text-right">
              Sessioni aperte dalle aziende. Prenoti un posto e conosci il team, anche senza match.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-viola-900 hover:bg-rosso-600 text-white font-bold transition-all shadow-xl shadow-viola-200 group"
            >
              Tutti gli eventi
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <ol className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-3xl bg-white shadow-card p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rosso-50 flex items-center justify-center text-rosso-600">
                  <Icon size={22} />
                </div>
                <span className="font-display text-3xl text-viola-200">{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-viola-950 tracking-tight">{title}</h3>
              <p className="text-viola-500 font-medium leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>

        <LandingEvents />
      </div>
    </section>
  );
}
