"use client";

import { useCallback, useState } from "react";
import {
  Zap,
  Plus,
  Users,
  Link as LinkIcon,
  Clock,
  Loader2,
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import { InterviewEvent } from "@/types/interview";
import { updateMeetingLinkAction, getEventParticipantsAction } from "@/app/actions/interviews";
import { motion } from "framer-motion";
import { duration, ease } from "@/lib/motion";
import { ParticipantList, type Participant } from "@/components/interviews/ParticipantList";
import { formatEventMonth, formatEventDayOfMonth, formatEventTime } from "@/components/interviews/event-time";
import Link from "next/link";
import Image from "next/image";

interface EventsClientProps {
  initialEvents: InterviewEvent[];
}

const ITEMS_PER_PAGE = 5;

// List entrance: short rise, stagger capped so the last card lands within ~200ms
const itemEnter = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.state, ease: ease.out, delay: Math.min(index * 0.04, 0.2) },
});

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const [events, setEvents] = useState<InterviewEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [linkEvent, setLinkEvent] = useState<InterviewEvent | null>(null);
  const [newLink, setNewLink] = useState("");
  const [viewingParticipants, setViewingParticipants] = useState<InterviewEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

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

  const closeLinkSheet = useCallback(() => setLinkEvent(null), []);
  const closeParticipants = useCallback(() => setViewingParticipants(null), []);

  const openLinkEditor = (event: InterviewEvent) => {
    setLinkEvent(event);
    setNewLink(event.meetingLink || "");
  };

  const handleUpdateLink = async (eventId: string) => {
    if (!newLink) return;
    setLoading(true);
    const res = await updateMeetingLinkAction(eventId, newLink);
    if (res.success) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, meetingLink: newLink.trim() } : e));
      setLinkEvent(null);
      setNewLink("");
      toast.success("Link aggiornato con successo!");
    } else {
      toast.error(res.error || "Errore durante l'aggiornamento");
    }
    setLoading(false);
  };

  const handleViewParticipants = async (event: InterviewEvent) => {
    setViewingParticipants(event);
    setLoadingParticipants(true);
    const res = await getEventParticipantsAction(event.id);
    if (res.success) {
      setParticipants(res.data || []);
    } else {
      toast.error(res.error || "Errore nel caricamento dei partecipanti");
    }
    setLoadingParticipants(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFDFC]">
      <PageHeader
        title="Smart Interview"
        subtitle="Gestione eventi e speed-dating"
        actions={
          <>
            <Link
              href="/dashboard/events/new"
              aria-label="Nuovo evento"
              className="pressable md:hidden w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Plus size={22} />
            </Link>
            <Link
              href="/dashboard/events/new"
              className="pressable hidden md:inline-flex items-center gap-2 rounded-full h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10 transition-colors text-sm font-display font-bold italic"
            >
              <Plus size={18} /> Nuovo evento
            </Link>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-tabbar">
        <main className="max-w-6xl w-full mx-auto px-4 py-5 md:p-12 space-y-6 md:space-y-12">
          {/* Search + stats */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 md:items-center md:justify-between md:bg-white md:p-4 md:rounded-[2rem] md:border md:border-slate-50 md:shadow-sm">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
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
                className="h-12 pl-12 pr-4 rounded-2xl bg-white md:bg-slate-50/50 border-slate-100 md:border-transparent focus:bg-white focus:border-emerald-500/20 transition-all font-medium"
              />
            </div>

            <dl className="flex items-center gap-4 md:gap-8 px-1 md:px-4 text-sm">
              <div className="flex items-baseline md:flex-col md:items-center gap-1.5 md:gap-0">
                <dd className="order-1 md:order-2 font-display font-bold text-slate-950 text-lg md:text-xl md:mt-1 tabular-nums">{events.length}</dd>
                <dt className="order-2 md:order-1 text-slate-500 md:text-[9px] md:font-black md:text-slate-400 md:uppercase md:tracking-widest md:leading-none">Eventi</dt>
              </div>
              <div className="w-px h-4 md:h-8 bg-slate-200 md:bg-slate-100" aria-hidden="true" />
              <div className="flex items-baseline md:flex-col md:items-center gap-1.5 md:gap-0">
                <dd className="order-1 md:order-2 font-display font-bold text-emerald-600 text-lg md:text-xl md:mt-1 tabular-nums">{totalBookings}</dd>
                <dt className="order-2 md:order-1 text-slate-500 md:text-[9px] md:font-black md:text-slate-400 md:uppercase md:tracking-widest md:leading-none">Prenotazioni</dt>
              </div>
            </dl>
          </div>

          {/* Events */}
          <div className="space-y-6">
            {paginatedEvents.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 md:gap-6">
                {paginatedEvents.map((event, index) => {
                  const booked = event.bookingCount || 0;
                  const fill = Math.min(100, (booked / (event.maxSlots || 1)) * 100);
                  return (
                    <motion.li key={event.id} {...itemEnter(index)}>
                      <article className="relative bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-[box-shadow,scale] duration-200 group overflow-hidden ring-1 ring-slate-100 has-[.card-link:active]:scale-[0.985] motion-reduce:has-[.card-link:active]:scale-100 lg:flex">
                        {/* Cover */}
                        <div className="relative aspect-video lg:aspect-auto lg:w-72 lg:min-h-60 overflow-hidden shrink-0 bg-slate-900">
                          {event.imageUrl ? (
                            <Image
                              src={event.imageUrl}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 288px, 100vw"
                              className="object-cover md:group-hover:scale-105 transition-transform duration-1000"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 border border-white/10">
                                <ImageIcon size={28} />
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 flex flex-col items-center shadow-lg">
                            <span className="text-[11px] font-black uppercase text-slate-500 leading-none">
                              {formatEventMonth(event.date)}
                            </span>
                            <span className="text-lg font-display font-bold text-slate-950 leading-none mt-0.5 tabular-nums">
                              {formatEventDayOfMonth(event.date).padStart(2, "0")}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 p-5 md:p-8 flex flex-col">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[11px] md:text-[10px] uppercase px-2 py-0.5 max-w-full justify-start">
                              {event.topic || "Speed Dating"}
                            </Badge>
                            <span className="flex items-center gap-1 text-[13px] md:text-xs font-bold text-slate-500 tabular-nums">
                              <Clock size={13} />
                              {formatEventTime(event.date)}
                            </span>
                          </div>

                          {/* The title link covers the whole card (stretched), the tools below sit above it */}
                          <h2 className="mt-2 text-lg md:text-xl font-display font-bold text-slate-950 leading-snug line-clamp-2">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className="card-link md:hover:text-emerald-600 transition-colors outline-none after:absolute after:inset-0 after:rounded-3xl md:after:rounded-[2.5rem] focus-visible:after:ring-2 focus-visible:after:ring-emerald-500"
                            >
                              {event.title}
                            </Link>
                          </h2>

                          <p className="hidden md:block mt-3 text-slate-500 text-sm leading-relaxed line-clamp-2">
                            {event.description || "Nessuna descrizione fornita."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] md:text-sm text-slate-600">
                            <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
                              <Users size={16} className="text-emerald-500" />
                              {booked} / {event.maxSlots}
                              <span className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
                                <span className="block h-full bg-emerald-500 rounded-full" style={{ width: `${fill}%` }} />
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                              <MapPin size={16} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{event.location || "Online"}</span>
                            </span>
                          </div>

                          {/* Owner tools */}
                          <div className="relative z-10 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewParticipants(event)}
                              className="pressable flex-1 md:flex-none h-11 rounded-full px-4 md:px-5 inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm"
                            >
                              <Users size={16} /> Iscritti
                            </button>
                            <button
                              type="button"
                              onClick={() => openLinkEditor(event)}
                              className="pressable flex-1 md:flex-none h-11 rounded-full px-4 md:px-5 inline-flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-sm"
                            >
                              <LinkIcon size={16} />
                              <span className="truncate">{event.meetingLink ? "Modifica link" : "Aggiungi meeting"}</span>
                            </button>
                            <span className="hidden md:inline-flex ml-auto items-center gap-1 text-sm font-bold text-slate-400 group-hover:text-emerald-600 transition-colors" aria-hidden="true">
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
                className="text-center px-6 py-14 md:py-24 bg-white rounded-3xl md:rounded-[3rem] border border-dashed border-slate-200"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-5 md:mb-6">
                  <Zap size={32} />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="text-xl font-display font-bold italic text-slate-950 mb-2">Nessun risultato</h3>
                    <p className="text-[15px] text-slate-500 max-w-sm mx-auto">Nessun evento corrisponde a &quot;{searchQuery}&quot;.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-display font-bold italic text-slate-950 mb-2">Ancora nulla qui</h3>
                    <p className="text-[15px] text-slate-500 mb-7 md:mb-8 max-w-sm mx-auto">Crea il tuo primo evento Smart Interview per incontrare nuovi talenti.</p>
                    <Link
                      href="/dashboard/events/new"
                      className="pressable inline-flex items-center gap-2 rounded-full px-8 h-12 shadow-xl shadow-emerald-500/10 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold italic"
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
                  className="pressable rounded-full h-11 w-11 flex items-center justify-center bg-white border border-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 h-11 bg-white border border-slate-100 rounded-full flex items-center">
                  <span className="text-sm font-bold text-slate-950 tabular-nums">{currentPage} / {totalPages}</span>
                </div>
                <button
                  type="button"
                  aria-label="Pagina successiva"
                  className="pressable rounded-full h-11 w-11 flex items-center justify-center bg-white border border-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>
        </main>
      </div>

      {/* Participants */}
      <BottomSheet open={!!viewingParticipants} onClose={closeParticipants} title="Iscritti">
        {viewingParticipants && (
          <p className="-mt-2 mb-4 text-sm text-slate-500 truncate">{viewingParticipants.title}</p>
        )}
        <ParticipantList loading={loadingParticipants} participants={participants} />
      </BottomSheet>

      {/* Meeting link editor */}
      <BottomSheet open={!!linkEvent} onClose={closeLinkSheet} title="Link del meeting">
        {linkEvent && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateLink(linkEvent.id);
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-500 truncate -mt-2">{linkEvent.title}</p>
            <div className="relative">
              <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                aria-label="Link del meeting"
                placeholder="https://meet.google.com/..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white text-base"
              />
            </div>
            <p className="text-[13px] text-slate-500">Solo i professionisti iscritti vedranno questo link.</p>
            <button
              type="submit"
              disabled={loading || !newLink}
              className="pressable w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
              Salva link
            </button>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
