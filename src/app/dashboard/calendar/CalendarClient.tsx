"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Clock, 
  Zap,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export default function CalendarClient({ initialEvents }: CalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const events = initialEvents.map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end)
  }));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const selectedDateEvents = events.filter(event => isSameDay(event.start, selectedDate));

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FDFDFC]">
      {/* Header - Simple & Clean */}
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40 shrink-0">
        <div>
          <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Il Tuo Calendario</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Gestisci i tuoi appuntamenti</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-bold px-4 py-1">
             {events.length} Eventi Totali
          </Badge>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-6 h-full items-stretch max-w-full mx-auto w-full">
          
          {/* Left: Calendar Grid */}
          <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col">
            <Card className="flex-1 p-6 bg-white border-slate-100 rounded-[2.5rem] shadow-premium overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h2 className="text-2xl font-display italic font-bold text-slate-950 capitalize">
                      {format(currentMonth, "MMMM yyyy", { locale: it })}
                  </h2>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl border-slate-100 h-9 w-9 hover:bg-slate-50">
                        <ChevronLeft size={16} />
                      </Button>
                      <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl border-slate-100 h-9 w-9 hover:bg-slate-50">
                        <ChevronRight size={16} />
                      </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px mb-2 shrink-0">
                  {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(day => (
                      <div key={day} className="text-center py-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{day}</span>
                      </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-7 gap-2 min-h-0">
                  {calendarDays.map((day) => {
                      const dayEvents = events.filter(e => isSameDay(e.start, day));
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentMonth = isSameMonth(day, monthStart);
                      
                      return (
                        <button
                            key={day.toString()}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "relative rounded-2xl p-1.5 transition-all group flex flex-col items-center justify-center gap-0.5 min-h-0",
                              isSelected 
                                  ? "bg-slate-950 text-white shadow-xl shadow-slate-200 scale-105 z-10" 
                                  : isToday(day)
                                    ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-100 ring-offset-2"
                                    : isCurrentMonth ? "bg-white hover:bg-slate-50 border border-slate-100" : "bg-white opacity-20 pointer-events-none"
                            )}
                        >
                            <span className={cn(
                              "text-xs font-bold",
                              isSelected ? "text-white" : isCurrentMonth ? "text-slate-900" : "text-slate-300"
                            )}>
                              {format(day, "d")}
                            </span>
                            
                            <div className="flex gap-0.5 justify-center mt-0.5">
                              {dayEvents.slice(0, 3).map((e) => (
                                  <div 
                                    key={e.id} 
                                    className={cn(
                                        "w-1 h-1 rounded-full",
                                        isSelected ? "bg-emerald-400" : e.type === 'smart' ? "bg-emerald-500" : "bg-primary"
                                    )} 
                                  />
                              ))}
                            </div>
                        </button>
                      );
                  })}
                </div>
            </Card>
          </div>

          {/* Right: Selected Day Events */}
          <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between px-2 mb-4 shrink-0">
                <h3 className="text-lg font-display italic font-bold text-slate-950">
                  {isToday(selectedDate) ? "Oggi" : format(selectedDate, "d MMMM", { locale: it })}
                </h3>
                <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                  {selectedDateEvents.length} eventi
                </Badge>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {selectedDateEvents.length > 0 ? (
                      selectedDateEvents.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                             <Card className="relative overflow-hidden bg-white border-slate-100/60 rounded-[2rem] shadow-premium hover:shadow-2xl hover:border-emerald-200/50 transition-all duration-500 group">
                                {/* Decorative background element */}
                                <div className={cn(
                                  "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-10",
                                  event.type === 'smart' ? "bg-emerald-500" : "bg-blue-500"
                                )} />
                                
                                <div className="p-6 relative z-10 flex flex-col gap-6">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                      <div className={cn(
                                        "w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center relative",
                                        event.type === 'smart' ? "bg-emerald-50" : "bg-slate-50"
                                      )}>
                                        {event.image ? (
                                          <Image src={event.image} alt="" width={64} height={64} className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" />
                                        ) : (
                                          <div className="text-slate-300">
                                            {event.type === 'smart' ? <Zap size={28} /> : <User size={28} />}
                                          </div>
                                        )}
                                        <div className={cn(
                                          "absolute -top-2 -left-2 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm border border-white",
                                          event.type === 'smart' ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
                                        )}>
                                          {event.type === 'smart' ? <Zap size={10} /> : <Clock size={10} />}
                                        </div>
                                      </div>

                                      <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <Badge className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.15em] rounded-lg px-2 py-0.5 border-none",
                                            event.type === 'smart' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                          )}>
                                            {event.type === 'smart' ? 'Smart' : 'Match'}
                                          </Badge>
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
                                            <Clock size={10} className="text-slate-300" />
                                            {format(event.start, "HH:mm")}
                                          </div>
                                        </div>
                                        <h4 className="font-display font-bold italic text-slate-950 text-base leading-tight group-hover:text-emerald-600 transition-colors">
                                          {event.title}
                                        </h4>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-end justify-between gap-4 mt-1">
                                    <p className="text-xs text-slate-400 font-medium line-clamp-2 max-w-[70%] leading-relaxed">
                                      {event.description}
                                    </p>

                                    {event.link ? (
                                      (() => {
                                        const now = new Date();
                                        const startTime = new Date(event.start);
                                        const fiveMinutesBefore = new Date(startTime.getTime() - 5 * 60 * 1000);
                                        const isActive = now >= fiveMinutesBefore && now <= new Date(event.end);
                                        
                                        if (isActive) {
                                          return (
                                            <a 
                                              href={event.link} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="h-12 px-5 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group/btn"
                                            >
                                              <Video size={18} className="group-hover/btn:animate-pulse" />
                                              <span className="text-xs font-black uppercase tracking-widest">Partecipa</span>
                                            </a>
                                          );
                                        } else {
                                          const daysUntil = differenceInDays(startTime, now);
                                          let label = "Tra poco";
                                          
                                          if (daysUntil > 0) {
                                            label = `Tra ${daysUntil} ${daysUntil === 1 ? 'giorno' : 'giorni'}`;
                                          } else if (isSameDay(now, startTime)) {
                                            label = `Oggi alle ${format(startTime, "HH:mm")}`;
                                          }

                                          return (
                                            <CustomTooltip content="I pulsanti delle chiamate si sbloccano 5 minuti prima della chiamata">
                                              <div 
                                                className="h-12 px-5 rounded-xl bg-slate-100 text-slate-400 flex flex-col items-center justify-center cursor-help opacity-70 grayscale"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Video size={16} />
                                                  <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                                                </div>
                                                <span className="text-[8px] font-medium opacity-60">Locked</span>
                                              </div>
                                            </CustomTooltip>
                                          );
                                        }
                                      })()
                                    ) : (
                                      <Button variant="outline" className="h-12 px-5 rounded-xl border-slate-100 text-slate-400 font-bold text-xs hover:bg-slate-50">
                                        Dettagli
                                      </Button>
                                    )}
                                  </div>
                                </div>
                             </Card>
                        </motion.div>
                      ))
                  ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-32 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100"
                      >
                        <p className="text-slate-400 text-[10px] font-medium italic px-6 uppercase tracking-wider">Libero</p>
                      </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
