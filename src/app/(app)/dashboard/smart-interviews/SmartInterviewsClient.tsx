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

// Company avatars without a logo: initials on a brand colour, rotating down the list
const AVATAR_TONES = ["bg-blu text-white", "bg-viola text-rosa", "bg-rosa text-viola"];

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
          <Badge variant="outline" className="hidden md:inline-flex h-9 px-4 text-chip tabular-nums">
            {events.length} eventi disponibili
          </Badge>
        }
      />

      <PageBody className="custom-scrollbar">
        <main className="max-w-5xl w-full mx-auto px-4 py-5 md:p-10 space-y-8 md:space-y-10">
          {/* Intro */}
          <div className="bg-viola rounded-card md:rounded-[2.25rem] p-6 md:p-10 text-white">
            <div className="max-w-xl">
              <div className="hidden md:flex w-14 h-14 bg-rosa text-viola rounded-full items-center justify-center mb-6">
                <Zap size={26} strokeWidth={1.75} />
              </div>
              <h2 className="text-title md:text-display font-display mb-3 md:mb-4 text-balance">
                Trova il tuo prossimo <span className="font-script text-rosa">team</span> in 15 minuti.
              </h2>
              <p className="text-crema text-body md:text-lg">
                <span className="md:hidden">Prenota uno slot nelle sessioni organizzate dalle aziende.</span>
                <span className="hidden md:inline">Partecipa alle Smart Interview organizzate dalle aziende. Prenota il tuo posto e preparati a dire helllo.</span>
              </p>
            </div>
          </div>

          <section className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-3 px-1 md:px-2">
              <h3 className="text-title font-display text-viola">Eventi disponibili</h3>
              <Badge className="h-8 px-4 text-chip tabular-nums">
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
                      <article className="relative h-full flex flex-col p-6 bg-white ring-1 ring-viola/15 hover:ring-viola/30 rounded-card transition-[box-shadow,scale] duration-200 group has-[.card-link:active]:scale-[0.985] motion-reduce:has-[.card-link:active]:scale-100">
                        <div className="flex items-center gap-3 mb-4 md:mb-5">
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0 relative ${AVATAR_TONES[idx % AVATAR_TONES.length]}`}>
                            {event.companyImage ? (
                              <Image src={event.companyImage} alt="" fill sizes="56px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-lg uppercase">
                                {event.companyName ? event.companyName[0] : "?"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="hidden md:block text-label text-viola-500 mb-0.5">Azienda ospitante</p>
                            <p className="font-bold text-viola truncate">{event.companyName}</p>
                          </div>
                        </div>

                        <div className="flex-1 space-y-2 md:space-y-3">
                          <h4 className="text-xl md:text-2xl font-display font-bold text-viola leading-snug line-clamp-2">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className="card-link outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ring"
                            >
                              {event.title}
                            </Link>
                          </h4>
                          {event.description && (
                            <p className="text-viola-500 text-body line-clamp-2 md:line-clamp-3">{event.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-2 text-chip text-viola tabular-nums">
                            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-crema">
                              <Calendar size={16} strokeWidth={1.75} aria-hidden="true" />
                              <span className="first-letter:uppercase">{formatEventDayShort(event.date)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-crema">
                              <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                              {formatEventTime(event.date)}
                            </span>
                          </div>
                        </div>

                        <div className="relative z-10 mt-5 md:mt-6 pt-4 border-t border-viola/15 flex items-center justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="hidden md:block text-label text-viola-500">Disponibilità</span>
                            <span className="text-[15px] md:text-sm font-bold text-viola tabular-nums">
                              <SeatCount value={event.bookingCount} /> / {event.maxSlots} <span className="text-viola-500 font-medium">iscritti</span>
                            </span>
                          </div>

                          {event.isBooked ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 text-viola bg-rosa h-11 px-4 rounded-full font-bold text-sm">
                                <CheckCircle2 size={16} /> Iscritto
                              </span>
                              <button
                                type="button"
                                onClick={() => setCancelId(event.id)}
                                disabled={isLoading}
                                aria-label="Annulla prenotazione"
                                className="pressable h-11 px-3 rounded-full text-sm font-bold text-viola underline decoration-viola/40 underline-offset-4 hover:decoration-viola transition-colors disabled:opacity-50"
                              >
                                Annulla
                              </button>
                            </div>
                          ) : isFull ? (
                            <span className="inline-flex items-center h-11 rounded-full border border-viola/30 text-viola-500 font-bold text-sm px-4">Posti esauriti</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBook(event.id)}
                              disabled={isLoading}
                              className="pressable shrink-0 inline-flex items-center justify-center gap-2 rounded-full h-11 px-6 bg-rosso hover:bg-rosso-600 text-white font-bold text-sm transition-colors disabled:opacity-60"
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
              <div className="text-center px-6 py-14 md:py-20 bg-crema rounded-card">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-rosa rounded-full flex items-center justify-center text-viola mx-auto mb-5 md:mb-6">
                  <Zap size={32} strokeWidth={1.75} />
                </div>
                <h3 className="text-title font-display text-viola mb-2">Nessun evento disponibile</h3>
                <p className="text-body text-viola-500 max-w-sm mx-auto">Al momento non ci sono Smart Interview programmate. Torna a trovarci presto!</p>
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
