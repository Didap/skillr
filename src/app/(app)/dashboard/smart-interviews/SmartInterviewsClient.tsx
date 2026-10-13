"use client";

import { useState } from "react";
import {
  Zap,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { bookInterviewAction, cancelInterviewBookingAction } from "@/app/actions/interviews";
import { formatEventDayShort, formatEventTime } from "@/lib/rome-time";
import { SeatCount } from "@/components/interviews/SeatCount";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { duration, ease, haptic } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";

interface SmartInterviewEvent {
  id: string;
  title: string;
  description: string | null;
  date: string | Date;
  maxSlots: number;
  bookingCount: number;
  companyName: string;
  companyImage: string | null;
  isBooked: boolean;
}

interface SmartInterviewsClientProps {
  initialEvents: SmartInterviewEvent[];
}

export default function SmartInterviewsClient({ initialEvents }: SmartInterviewsClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const handleBook = async (eventId: string) => {
    setLoadingId(eventId);
    const res = await bookInterviewAction(eventId);
    if (res.success) {
      haptic();
      toast.success("Prenotazione effettuata con successo!");
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isBooked: true, bookingCount: e.bookingCount + 1 } : e));
    } else {
      toast.error(res.error || "Errore durante la prenotazione");
    }
    setLoadingId(null);
  };

  // Confirmed from the sheet
  const handleCancel = async (eventId: string) => {
    setLoadingId(eventId);
    const res = await cancelInterviewBookingAction(eventId);
    if (res.success) {
      toast.success("Prenotazione annullata.");
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isBooked: false, bookingCount: Math.max(0, e.bookingCount - 1) } : e));
      setCancelId(null);
    } else {
      toast.error(res.error || "Errore durante l'annullamento");
    }
    setLoadingId(null);
  };

  return (
    <>
      <PageHeader
        title="Smart Interview"
        subtitle="Speed-dating e matching rapido"
        actions={
          <Badge variant="outline" className="hidden md:inline-flex rounded-full border-slate-200 text-slate-500 font-bold px-4 py-1 h-auto">
            {events.length} Eventi Disponibili
          </Badge>
        }
      />

      <PageBody className="custom-scrollbar">
        <main className="max-w-5xl w-full mx-auto px-4 py-5 md:p-10 space-y-8 md:space-y-10">
          {/* Intro */}
          <div className="bg-emerald-600 rounded-3xl md:rounded-[2.5rem] p-5 md:p-10 text-white relative overflow-hidden shadow-xl md:shadow-2xl shadow-emerald-200/50">
            <div className="relative z-10 max-w-xl">
              <div className="hidden md:flex w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center mb-6">
                <Zap size={28} fill="currentColor" />
              </div>
              <h2 className="text-2xl md:text-4xl font-display italic font-bold mb-2 md:mb-4 leading-tight text-balance">Trova il tuo prossimo team in 15 minuti.</h2>
              <p className="text-emerald-50/90 font-medium text-[15px] md:text-lg leading-relaxed">
                <span className="md:hidden">Prenota uno slot nelle sessioni organizzate dalle aziende.</span>
                <span className="hidden md:inline">Partecipa alle sessioni di Smart Interview organizzate dalle migliori aziende. Prenota il tuo slot e preparati a brillare.</span>
              </p>
            </div>
            <Zap className="absolute -right-16 -bottom-16 md:-right-20 md:-bottom-20 text-white/5 w-56 h-56 md:w-[400px] md:h-[400px] rotate-12" aria-hidden="true" />
          </div>

          <section className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-3 px-1 md:px-2">
              <h3 className="text-xl font-display italic font-bold text-slate-950">Eventi disponibili</h3>
              <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600 font-bold text-xs h-auto py-1">
                {events.length} sessioni attive
              </Badge>
            </div>

            {events.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {events.map((event, idx) => {
                  const isFull = event.bookingCount >= event.maxSlots;
                  const isLoading = loadingId === event.id;
                  return (
                    <motion.li
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: duration.state, ease: ease.out, delay: Math.min(idx * 0.04, 0.2) }}
                    >
                      <article className="relative h-full flex flex-col p-5 md:p-8 bg-white ring-1 ring-slate-100 rounded-3xl md:rounded-[2.5rem] shadow-premium hover:shadow-xl transition-[box-shadow,scale] duration-200 group has-[.card-link:active]:scale-[0.985] motion-reduce:has-[.card-link:active]:scale-100">
                        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                          <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 relative">
                            {event.companyImage ? (
                              <Image src={event.companyImage} alt="" fill sizes="56px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                {event.companyName ? event.companyName[0] : "?"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="hidden md:block text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-0.5">Azienda Ospitante</p>
                            <p className="font-bold text-slate-950 truncate">{event.companyName}</p>
                          </div>
                        </div>

                        <div className="flex-1 space-y-2 md:space-y-4">
                          <h4 className="text-lg md:text-xl font-display font-bold text-slate-950 leading-snug line-clamp-2">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className="card-link md:hover:text-emerald-600 transition-colors outline-none after:absolute after:inset-0 after:rounded-3xl md:after:rounded-[2.5rem] focus-visible:after:ring-2 focus-visible:after:ring-emerald-500"
                            >
                              {event.title}
                            </Link>
                          </h4>
                          {event.description && (
                            <p className="text-slate-500 text-[15px] md:text-sm line-clamp-2 md:line-clamp-3 leading-relaxed">{event.description}</p>
                          )}

                          <div className="flex items-center gap-5 pt-2 md:pt-4 md:border-t md:border-slate-50 text-sm font-bold text-slate-600 tabular-nums">
                            <span className="inline-flex items-center gap-2">
                              <Calendar size={16} className="text-emerald-500" />
                              {formatEventDayShort(event.date)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Clock size={16} className="text-emerald-500" />
                              {formatEventTime(event.date)}
                            </span>
                          </div>
                        </div>

                        <div className="relative z-10 mt-5 md:mt-8 pt-4 md:pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilità</span>
                            <span className="text-[15px] md:text-sm font-bold text-slate-700 tabular-nums">
                              <SeatCount value={event.bookingCount} /> / {event.maxSlots} <span className="text-slate-500 font-medium">iscritti</span>
                            </span>
                          </div>

                          {event.isBooked ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 h-11 px-3.5 rounded-full font-bold text-sm border border-emerald-100">
                                <CheckCircle2 size={16} /> Iscritto
                              </span>
                              <button
                                type="button"
                                onClick={() => setCancelId(event.id)}
                                disabled={isLoading}
                                aria-label="Annulla prenotazione"
                                className="pressable h-11 px-3 rounded-full text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                Annulla
                              </button>
                            </div>
                          ) : isFull ? (
                            <span className="inline-flex items-center h-11 rounded-full border border-slate-200 text-slate-500 font-bold text-sm px-4">Posti esauriti</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBook(event.id)}
                              disabled={isLoading}
                              className="pressable shrink-0 inline-flex items-center justify-center gap-2 rounded-full h-11 px-6 bg-slate-950 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-slate-900/10 transition-colors disabled:opacity-60"
                            >
                              {isLoading ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : "Prenota ora"}
                            </button>
                          )}
                        </div>
                      </article>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center px-6 py-14 md:py-20 bg-white rounded-3xl md:rounded-[2.5rem] border border-dashed border-slate-200">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-5 md:mb-6">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-display font-bold italic text-slate-950 mb-2">Nessun evento disponibile</h3>
                <p className="text-[15px] text-slate-500 max-w-sm mx-auto">Al momento non ci sono Smart Interview programmate. Torna a trovarci presto!</p>
              </div>
            )}
          </section>
        </main>
      </PageBody>

      <ConfirmSheet
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => cancelId && handleCancel(cancelId)}
        loading={!!cancelId && loadingId === cancelId}
        title="Annullare la prenotazione?"
        description="Il posto tornerà disponibile per altri candidati. Potrai prenotare di nuovo finché ci sono posti liberi."
        confirmText="Annulla prenotazione"
      />
    </>
  );
}
