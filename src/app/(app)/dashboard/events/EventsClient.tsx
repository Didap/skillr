"use client";

import { useState } from "react";
import {
  Zap,
  Plus,
  Users,
  Link as LinkIcon,
  Clock,
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { InterviewEvent } from "@/types/interview";
import { motion } from "framer-motion";
import { duration, ease } from "@/lib/motion";
import { ParticipantsSheet } from "@/components/interviews/ParticipantsSheet";
import { MeetingLinkSheet } from "@/components/interviews/MeetingLinkSheet";
import { formatEventMonth, formatEventDayOfMonth, formatEventTime } from "@/lib/rome-time";
import Link from "next/link";
import Image from "next/image";

interface EventsClientProps {
  initialEvents: InterviewEvent[];
}

const ITEMS_PER_PAGE = 5;

// Flat brand blocks behind events without a cover, rotating down the list
const COVER_TONES = ["bg-blu text-rosa", "bg-viola text-rosa", "bg-rosa text-viola"];

// List entrance: short rise, stagger capped so the last card lands within ~200ms
const itemEnter = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.state, ease: ease.out, delay: Math.min(index * 0.04, 0.2) },
});

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const [events, setEvents] = useState<InterviewEvent[]>(initialEvents);
  const [linkEvent, setLinkEvent] = useState<InterviewEvent | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<InterviewEvent | null>(null);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalBookings = events.reduce((acc, curr) => acc + (curr.bookingCount || 0), 0);

  return (
    <>
      <PageHeader
        title="Smart Interview"
        subtitle="Gestione eventi e speed-dating"
        actions={
          <>
            <Link
              href="/dashboard/events/new"
              aria-label="Nuovo evento"
              className="pressable md:hidden w-11 h-11 rounded-full bg-rosso hover:bg-rosso-600 text-white flex items-center justify-center"
            >
              <Plus size={22} />
            </Link>
            <Link
              href="/dashboard/events/new"
              className="pressable hidden md:inline-flex items-center gap-2 rounded-full h-11 px-6 bg-rosso hover:bg-rosso-600 text-white transition-colors text-sm font-bold"
            >
              <Plus size={18} /> Nuovo evento
            </Link>
          </>
        }
      />

      <PageBody className="custom-scrollbar">
        <main className="max-w-6xl w-full mx-auto px-4 py-5 md:p-12 space-y-6 md:space-y-12">
          {/* Search + stats */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 md:items-center md:justify-between md:bg-white md:p-3 md:pr-6 md:rounded-card md:ring-1 md:ring-viola/15">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-viola-400 group-focus-within:text-viola transition-colors pointer-events-none" size={18} />
              <Input
                type="search"
                enterKeyHint="search"
                aria-label="Cerca tra i tuoi eventi"
                placeholder="Cerca tra i tuoi eventi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                } }
                className="h-12 pl-12 pr-4"
              />
            </div>

            <dl className="flex items-center gap-4 md:gap-8 px-1 md:px-4 text-sm">
              <div className="flex items-baseline md:flex-col md:items-center gap-1.5 md:gap-0">
                <dd className="order-1 md:order-2 font-display font-bold text-viola text-lg md:text-xl md:mt-0.5 tabular-nums">{events.length}</dd>
                <dt className="order-2 md:order-1 text-label text-viola-500">Eventi</dt>
              </div>
              <div className="w-px h-4 md:h-8 bg-viola/15" aria-hidden="true" />
              <div className="flex items-baseline md:flex-col md:items-center gap-1.5 md:gap-0">
                <dd className="order-1 md:order-2 font-display font-bold text-rosso-600 text-lg md:text-xl md:mt-0.5 tabular-nums">{totalBookings}</dd>
                <dt className="order-2 md:order-1 text-label text-viola-500">Prenotazioni</dt>
              </div>
            </dl>
          </div>

          {/* Events */}
          <div className="space-y-6">
            {paginatedEvents.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 md:gap-6">
                {paginatedEvents.map((event, index) => {
                  const booked = event.bookingCount || 0;
                  const isFull = booked >= (event.maxSlots || 0);
                  return (
                    <motion.li key={event.id} {...itemEnter(index)}>
                      <article className="relative bg-white rounded-card transition-[box-shadow,scale] duration-200 group overflow-hidden ring-1 ring-viola/15 hover:ring-viola/30 has-[.card-link:active]:scale-[0.985] motion-reduce:has-[.card-link:active]:scale-100 lg:flex">
                        {/* Cover: the photo, or a flat brand block */}
                        <div className={`relative aspect-video lg:aspect-auto lg:w-72 lg:min-h-60 overflow-hidden shrink-0 ${COVER_TONES[index % COVER_TONES.length]}`}>
                          {event.imageUrl ? (
                            <Image
                              src={event.imageUrl}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 288px, 100vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon size={32} strokeWidth={1.75} aria-hidden="true" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 md:top-4 md:left-4 min-w-14 bg-white text-viola rounded-2xl px-3 py-2 flex flex-col items-center">
                            <span className="text-label font-bold text-rosso-600 leading-none capitalize">
                              {formatEventMonth(event.date)}
                            </span>
                            <span className="text-2xl font-display font-bold leading-none mt-1 tabular-nums">
                              {formatEventDayOfMonth(event.date).padStart(2, "0")}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 p-5 md:p-6 flex flex-col">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Badge className="h-7 px-3 text-chip max-w-full justify-start">
                              {event.topic || "Speed Dating"}
                            </Badge>
                            <span className="flex items-center gap-1 text-label text-viola-500 tabular-nums">
                              <Clock size={14} />
                              {formatEventTime(event.date)}
                            </span>
                          </div>

                          {/* The title link covers the whole card (stretched), the tools below sit above it */}
                          <h2 className="mt-3 text-xl md:text-2xl font-display font-bold text-viola leading-snug line-clamp-2">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className="card-link outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ring"
                            >
                              {event.title}
                            </Link>
                          </h2>

                          <p className="hidden md:block mt-2 text-viola-500 text-body line-clamp-2">
                            {event.description || "Nessuna descrizione fornita."}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] md:text-sm text-viola">
                            <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-chip tabular-nums ${isFull ? "bg-rosa text-viola" : "bg-rosso text-white font-bold"}`}>
                              <Users size={14} aria-hidden="true" />
                              {booked} / {event.maxSlots}
                              <span className="sr-only">{isFull ? "posti, completo" : "posti occupati"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                              <MapPin size={16} strokeWidth={1.75} className="text-viola shrink-0" />
                              <span className="truncate">{event.location || "Online"}</span>
                            </span>
                          </div>

                          {/* Owner tools */}
                          <div className="relative z-10 mt-5 pt-4 border-t border-viola/15 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingParticipants(event)}
                              className="pressable flex-1 md:flex-none h-11 rounded-full px-4 md:px-5 inline-flex items-center justify-center gap-2 border border-viola bg-white hover:bg-crema text-viola font-bold text-sm"
                            >
                              <Users size={16} /> Iscritti
                            </button>
                            <button
                              type="button"
                              onClick={() => setLinkEvent(event)}
                              className="pressable flex-1 md:flex-none h-11 rounded-full px-4 md:px-5 inline-flex items-center justify-center gap-2 bg-crema hover:bg-rosa text-viola font-bold text-sm"
                            >
                              <LinkIcon size={16} />
                              <span className="truncate">{event.meetingLink ? "Modifica link" : "Aggiungi meeting"}</span>
                            </button>
                            <span className="hidden md:inline-flex ml-auto items-center gap-1 text-sm font-bold text-viola underline-offset-4 group-hover:underline" aria-hidden="true">
                              Dettagli <ChevronRight size={16} />
                            </span>
                          </div>
                        </div>
                      </article>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: duration.state } }}
                className="text-center px-6 py-14 md:py-20 bg-crema rounded-card"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-rosa rounded-full flex items-center justify-center text-viola mx-auto mb-5 md:mb-6">
                  <Zap size={32} strokeWidth={1.75} />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="text-title font-display text-viola mb-2">Nessun risultato</h3>
                    <p className="text-body text-viola-500 max-w-sm mx-auto">Nessun evento corrisponde a &quot;{searchQuery}&quot;.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-title font-display text-viola mb-2">Ancora nulla qui</h3>
                    <p className="text-body text-viola-500 mb-7 md:mb-8 max-w-sm mx-auto">Crea il tuo primo evento Smart Interview per incontrare nuovi talenti.</p>
                    <Link
                      href="/dashboard/events/new"
                      className="pressable inline-flex items-center gap-2 rounded-full px-8 h-12 bg-rosso hover:bg-rosso-600 text-white font-bold"
                    >
                      <Plus size={18} /> Inizia ora
                    </Link>
                  </>
                )}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Pagine" className="flex items-center justify-center gap-2 pt-2 md:pt-6">
                <button
                  type="button"
                  aria-label="Pagina precedente"
                  className="pressable rounded-full h-11 w-11 flex items-center justify-center bg-white border border-viola text-viola hover:bg-crema disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 h-11 bg-crema rounded-full flex items-center">
                  <span className="text-sm font-bold text-viola tabular-nums">{currentPage} / {totalPages}</span>
                </div>
                <button
                  type="button"
                  aria-label="Pagina successiva"
                  className="pressable rounded-full h-11 w-11 flex items-center justify-center bg-white border border-viola text-viola hover:bg-crema disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>
        </main>
      </PageBody>

      {/* Participants */}
      <ParticipantsSheet event={viewingParticipants} onClose={() => setViewingParticipants(null)} />

      {/* Meeting link editor */}
      <MeetingLinkSheet
        event={linkEvent}
        subtitle={linkEvent?.title}
        onClose={() => setLinkEvent(null)}
        onSaved={(link, eventId) =>
          setEvents(prev => prev.map(e => e.id === eventId ? { ...e, meetingLink: link } : e))
        }
      />
    </>
  );
}
