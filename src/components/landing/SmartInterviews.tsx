import Link from "next/link";
import { ArrowRight, CalendarPlus, Ticket, Video } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LandingEvents } from "@/components/landing/LandingEvents";
import { cn } from "@/lib/utils";

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
    <section id="smart-interview" className="py-20 md:py-32 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="space-y-5">
            <p className="text-label text-viola-500">Eventi</p>
            <h2 className="font-display text-display md:text-6xl md:leading-[1.05] tracking-[-0.03em] text-viola">
              Smart <span className="font-script text-rosso">Interview.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-6 items-start md:items-end">
            <p className="text-viola-500 max-w-md text-lg md:text-right leading-relaxed">
              Sessioni aperte dalle aziende. Prenoti un posto e conosci il team, anche senza match.
            </p>
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "outline" }), "group h-12 px-7 text-base gap-2")}
            >
              Tutti gli eventi
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
            </Link>
          </div>
        </div>

        <ol className="grid md:grid-cols-3 gap-3 md:gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-card bg-crema p-6 md:p-8 space-y-4 text-viola">
              <div className="flex items-center justify-between">
                <span className="size-12 rounded-full bg-white flex items-center justify-center">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="text-title text-viola-300" aria-hidden="true">{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{title}</h3>
              <p className="text-viola-500 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>

        <LandingEvents />
      </div>
    </section>
  );
}
