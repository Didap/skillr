"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Clock,
  Zap,
  User,
  Lock,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isToday,
  differenceInDays,
} from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CustomTooltip } from "@/components/ui/tooltip";
import { formatRomeDate } from "@/lib/rome-time";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { joinState } from "@/lib/calendar-utils";
import { duration, ease, haptic } from "@/lib/motion";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'match' | 'smart';
  link: string | null;
  description: string;
  image: string | null;
}

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// The month grid slides the way the user moved (dir: 1 next, -1 previous)
const monthVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: duration.state, ease: ease.out } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: duration.feedback, ease: ease.in } }),
};

const hhmm = (d: Date) => formatRomeDate(d, { hour: '2-digit', minute: '2-digit' });

export default function CalendarClient({ initialEvents }: CalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Direction of the last month change, so the grid slides the way the user moved
  const [monthDir, setMonthDir] = useState(0);

  const events = initialEvents.map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end)
  }));

  const nextMonth = () => {
    setMonthDir(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  const prevMonth = () => {
    setMonthDir(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  const goToToday = () => {
    const now = new Date();
    setMonthDir(currentMonth < startOfMonth(now) ? 1 : -1);
    setCurrentMonth(now);
    setSelectedDate(now);
    haptic();
  };
  const selectDay = (day: Date) => {
    if (!isSameDay(day, selectedDate)) haptic(6);
    setSelectedDate(day);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const selectedDateEvents = events.filter(event => isSameDay(event.start, selectedDate));
  const viewingToday = isToday(selectedDate) && isSameMonth(currentMonth, new Date());

  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle="Gestisci i tuoi appuntamenti"
        actions={
          <>
            <Badge variant="outline" className="hidden md:inline-flex h-9 rounded-full border-slate-200 text-slate-500 font-semibold px-4 text-sm tabular-nums">
              {events.length} eventi totali
            </Badge>
            <button
              type="button"
              onClick={goToToday}
              disabled={viewingToday}
              className="pressable h-11 px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Oggi
            </button>
          </>
        }
      />

      {/* lg: the page stops scrolling; the month grid fills the height and the agenda scrolls on its own */}
      <PageBody className="lg:overflow-hidden">
        <main className="px-4 pt-4 pb-8 md:p-8 lg:h-full grid lg:grid-cols-12 gap-6 md:gap-8 lg:gap-6 lg:items-stretch">

          {/* Month grid */}
          <section
            aria-label="Mese"
            className="relative lg:col-span-7 xl:col-span-8 lg:h-full lg:min-h-0 flex flex-col md:p-6 md:bg-white md:border md:border-slate-100 md:rounded-[2.5rem] md:shadow-premium overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-3 md:mb-6 shrink-0">
              <h2 className="text-2xl font-display italic text-slate-950 capitalize truncate" aria-live="polite">
                {format(currentMonth, "MMMM yyyy", { locale: it })}
              </h2>
              <div className="flex items-center gap-1 md:gap-2 -mr-1.5 md:mr-0">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Mese precedente"
                  className="pressable w-11 h-11 rounded-full md:rounded-xl md:border md:border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Mese successivo"
                  className="pressable w-11 h-11 rounded-full md:rounded-xl md:border md:border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 md:gap-2 mb-1 md:mb-2 shrink-0" aria-hidden="true">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center py-1">
                  <span className="text-[11px] md:text-[10px] font-bold md:font-black uppercase tracking-wider md:tracking-widest text-slate-400 md:text-slate-300">{day}</span>
                </div>
              ))}
            </div>

            <AnimatePresence mode="popLayout" initial={false} custom={monthDir}>
              <motion.div
                key={format(monthStart, "yyyy-MM")}
                custom={monthDir}
                variants={monthVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid grid-cols-7 gap-y-1 md:gap-2 lg:flex-1 lg:min-h-0"
              >
                {calendarDays.map((day) => {
                  const dayEvents = events.filter(e => isSameDay(e.start, day));
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const today = isToday(day);

                  return (
                    <button
                      key={day.toString()}
                      type="button"
                      onClick={() => selectDay(day)}
                      disabled={!isCurrentMonth}
                      aria-pressed={isSelected}
                      aria-current={today ? "date" : undefined}
                      aria-label={`${format(day, "EEEE d MMMM", { locale: it })}${dayEvents.length ? `, ${dayEvents.length} ${dayEvents.length === 1 ? "evento" : "eventi"}` : ""}`}
                      className={cn(
                        "pressable relative h-12 sm:h-14 lg:h-auto lg:min-h-0 flex flex-col items-center justify-center gap-0.5 rounded-xl md:rounded-2xl md:p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-[background-color,box-shadow,transform] duration-200",
                        // Desktop keeps the tiled look; phones use a circle on the number instead
                        isSelected
                          ? "md:bg-slate-950 md:shadow-xl md:shadow-slate-200 md:scale-105 md:z-10"
                          : today
                            ? "md:bg-emerald-50 md:ring-2 md:ring-emerald-100 md:ring-offset-2"
                            : isCurrentMonth
                              ? "md:bg-white md:hover:bg-slate-50 md:border md:border-slate-100"
                              : "opacity-25 md:bg-white"
                      )}
                    >
                      <span className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:h-auto rounded-full flex items-center justify-center text-[15px] md:text-xs font-semibold md:font-bold tabular-nums transition-colors duration-200",
                        isSelected
                          ? "bg-slate-950 text-white md:bg-transparent"
                          : today
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 md:bg-transparent md:ring-0"
                            : isCurrentMonth ? "text-slate-900" : "text-slate-300"
                      )}>
                        {format(day, "d")}
                      </span>

                      <span className="flex h-1 gap-0.5 justify-center md:mt-0.5" aria-hidden="true">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              isSelected ? "bg-emerald-500 md:bg-emerald-400" : e.type === 'smart' ? "bg-emerald-500" : "bg-primary"
                            )}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Agenda of the selected day */}
          <section
            aria-labelledby="agenda-heading"
            className="lg:col-span-5 xl:col-span-4 lg:h-full flex flex-col lg:min-h-0"
          >
            <div className="flex items-center justify-between gap-3 md:px-2 mb-3 md:mb-4 shrink-0">
              <h3 id="agenda-heading" className="text-xl md:text-lg font-display italic text-slate-950 first-letter:uppercase truncate">
                {isToday(selectedDate) ? "Oggi" : format(selectedDate, "EEEE d MMMM", { locale: it })}
              </h3>
              <span className="shrink-0 inline-flex items-center h-7 px-3 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs tabular-nums">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "evento" : "eventi"}
              </span>
            </div>

            <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-2 custom-scrollbar">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={format(selectedDate, "yyyy-MM-dd")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                  exit={{ opacity: 0, transition: { duration: duration.feedback } }}
                  className="space-y-3"
                >
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event) => (
                      <article
                        key={event.id}
                        className="relative overflow-hidden bg-white border border-slate-100/80 rounded-3xl md:rounded-[2rem] shadow-card md:shadow-premium md:hover:shadow-2xl md:hover:border-emerald-200/50 transition-[box-shadow,border-color] duration-500 group"
                      >
                        {/* Decorative background element */}
                        <div className={cn(
                          "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none",
                          event.type === 'smart' ? "bg-emerald-500" : "bg-blue-500"
                        )} />

                        <div className="p-4 md:p-6 relative z-10 flex flex-col gap-4 md:gap-5">
                          <div className="flex items-start gap-3 md:gap-4 min-w-0">
                            <div className={cn(
                              "w-12 h-12 md:w-16 md:h-16 rounded-2xl shrink-0 flex items-center justify-center relative",
                              event.type === 'smart' ? "bg-emerald-50" : "bg-slate-50"
                            )}>
                              {event.image ? (
                                <Image src={event.image} alt="" width={64} height={64} className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" />
                              ) : (
                                <div className="text-slate-300">
                                  {event.type === 'smart' ? <Zap className="size-6 md:size-7" /> : <User className="size-6 md:size-7" />}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 tabular-nums">
                                  <Clock size={14} className="text-slate-400" />
                                  {hhmm(event.start)}
                                  <span className="text-slate-400 font-medium">– {hhmm(event.end)}</span>
                                </span>
                                <span className={cn(
                                  "inline-flex items-center h-5 text-[11px] font-bold uppercase tracking-wider rounded-md px-1.5",
                                  event.type === 'smart' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                )}>
                                  {event.type === 'smart' ? 'Smart' : 'Match'}
                                </span>
                              </div>
                              <h4 className="font-display italic text-slate-950 text-lg md:text-base leading-snug line-clamp-2 break-words md:group-hover:text-emerald-600 transition-colors">
                                {event.title}
                              </h4>
                              {event.description && (
                                <p className="mt-1 text-sm md:text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {event.link ? (
                            (() => {
                              const now = new Date();
                              const startTime = event.start;
                              // Same rule as the match page (joinState).
                              const join = joinState(startTime, event.end, now.getTime());

                              if (join === "open") {
                                return (
                                  <a
                                    href={event.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pressable h-12 w-full sm:w-auto sm:self-end px-5 rounded-2xl md:rounded-xl bg-slate-950 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition-colors shadow-lg"
                                  >
                                    <Video size={18} />
                                    <span className="text-sm font-bold">Partecipa</span>
                                  </a>
                                );
                              } else if (join === "over") {
                                return (
                                  <div className="h-12 w-full sm:w-auto px-4 rounded-2xl md:rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center gap-2">
                                    <Check size={16} className="shrink-0" />
                                    <span className="text-sm font-bold">Concluso</span>
                                  </div>
                                );
                              } else {
                                const daysUntil = differenceInDays(startTime, now);
                                let label = "Tra poco";

                                if (daysUntil > 0) {
                                  label = `Tra ${daysUntil} ${daysUntil === 1 ? 'giorno' : 'giorni'}`;
                                } else if (isSameDay(now, startTime)) {
                                  label = `Oggi alle ${hhmm(startTime)}`;
                                }

                                return (
                                  <CustomTooltip content="I pulsanti delle chiamate si sbloccano 5 minuti prima della chiamata">
                                    <div className="h-12 w-full sm:w-auto px-4 rounded-2xl md:rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center gap-3 cursor-help">
                                      <Lock size={16} className="shrink-0" />
                                      <div className="flex flex-col leading-tight min-w-0">
                                        <span className="text-sm font-bold truncate">{label}</span>
                                        <span className="text-[11px] font-medium text-slate-500 truncate">Il link si attiva 5 min prima</span>
                                      </div>
                                    </div>
                                  </CustomTooltip>
                                );
                              }
                            })()
                          ) : (
                            <button
                              type="button"
                              className="pressable h-12 w-full sm:w-auto sm:self-end px-5 rounded-2xl md:rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                            >
                              Dettagli
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="h-28 md:h-32 flex flex-col items-center justify-center gap-1 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 px-6">
                      <p className="text-slate-500 text-sm font-semibold">Giornata libera</p>
                      <p className="text-slate-400 text-xs">Nessun appuntamento in programma</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

        </main>
      </PageBody>
    </>
  );
}
