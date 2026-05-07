"use client";

import { useState } from "react";
import { 
  Zap, 
  Plus, 
  Users, 
  Link as LinkIcon, 
  X, 
  Clock,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { InterviewEvent } from "@/types/interview";
import { updateMeetingLinkAction, getEventParticipantsAction } from "@/app/actions/interviews";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface Participant {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  title?: string | null;
  photoUrl?: string | null;
}

interface EventsClientProps {
  initialEvents: InterviewEvent[];
}

const ITEMS_PER_PAGE = 5;

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<InterviewEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
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

  const handleUpdateLink = async (eventId: string) => {
    if (!newLink) return;
    setLoading(true);
    const res = await updateMeetingLinkAction(eventId, newLink);
    if (res.success) {
      setEvents(events.map(e => e.id === eventId ? { ...e, meetingLink: newLink } : e));
      setEditingLink(null);
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
      {/* Header Standard del Sito */}
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">
            Smart Interviews
          </h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">
            Gestione eventi e Speed-Dating
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/dashboard/events/new">
            <Button 
              className="rounded-full gap-2 shadow-lg shadow-emerald-500/10 h-11 px-6 bg-emerald-500 hover:bg-emerald-600 transition-all text-xs font-display font-bold italic"
            >
              <Plus size={18} /> Nuovo Evento
            </Button>
          </Link>
          <div className="w-px h-8 bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-950">{session?.user?.name}</p>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{session?.user?.role}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-card overflow-hidden ring-4 ring-slate-50">
               {session?.user?.image ? (
                 <Image src={session.user.image} alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={24} />
                 </div>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area con Scroll Indipendente */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-6xl w-full mx-auto p-6 md:p-12 space-y-12">
          {/* Top Section: Search */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <Input 
                placeholder="Cerca tra i tuoi eventi..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                } }
                className="h-12 pl-12 pr-4 rounded-2xl bg-slate-50/50 border-transparent focus:bg-white focus:border-emerald-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-8 px-4">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Eventi</span>
                <span className="text-xl font-display font-bold text-slate-950 mt-1">{events.length}</span>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Booking</span>
                <span className="text-xl font-display font-bold text-emerald-600 mt-1">
                  {events.reduce((acc, curr) => acc + (curr.bookingCount || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {paginatedEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {paginatedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-white border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden border-none ring-1 ring-slate-100">
                        <div className="flex flex-col lg:flex-row">
                          {/* Image Side */}
                          <div className="lg:w-72 h-48 lg:h-auto relative overflow-hidden shrink-0">
                            {event.imageUrl ? (
                              <Image 
                                src={event.imageUrl} 
                                alt={event.title} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-1000" 
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 border border-white/10">
                                  <ImageIcon size={32} />
                                </div>
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                               <div className="bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 flex flex-col items-center border border-white/20 shadow-lg">
                                  <span className="text-[9px] font-black uppercase text-slate-400 leading-none">
                                    {format(new Date(event.date), "MMM", { locale: it })}
                                  </span>
                                  <span className="text-base font-display font-bold text-slate-950 leading-none mt-0.5">
                                    {format(new Date(event.date), "dd")}
                                  </span>
                               </div>
                            </div>
                          </div>

                          {/* Content Side */}
                          <div className="flex-1 p-8 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] uppercase px-2 py-0.5">
                                      {event.topic || "Speed Dating"}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      <Clock size={10} />
                                      {format(new Date(event.date), "HH:mm")}
                                    </div>
                                  </div>
                                  <Link href={`/dashboard/events/${event.id}`}>
                                    <h4 className="text-xl font-display font-bold text-slate-950 hover:text-emerald-500 transition-colors leading-tight">{event.title}</h4>
                                  </Link>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                    {event.bookingCount || 0} / {event.maxSlots} Iscritti
                                  </span>
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full" 
                                      style={{ width: `${Math.min(100, ((event.bookingCount || 0) / event.maxSlots) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                                {event.description || "Nessuna descrizione fornita."}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-50 mt-6">
                               <Button 
                                  variant="secondary"
                                  className="w-full sm:w-auto rounded-full px-5 h-10 gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                                  onClick={() => handleViewParticipants(event)}
                               >
                                  <Users size={14} /> Partecipanti
                               </Button>
                               
                               <div className="flex-1 w-full">
                                 {editingLink === event.id ? (
                                   <div className="flex gap-2">
                                     <Input 
                                       placeholder="Link..." 
                                       value={newLink}
                                       onChange={(e) => setNewLink(e.target.value)}
                                       className="h-10 rounded-xl flex-1 bg-slate-50 border-transparent focus:bg-white"
                                     />
                                     <Button onClick={() => handleUpdateLink(event.id)} disabled={loading} className="rounded-xl h-10 bg-emerald-500 px-4">
                                        {loading ? <Loader2 className="animate-spin size-4" /> : "OK"}
                                     </Button>
                                   </div>
                                 ) : (
                                   <Button 
                                      variant="ghost" 
                                      className="w-full sm:w-auto rounded-full gap-2 text-slate-400 hover:text-emerald-600 font-bold text-[11px] px-4"
                                      onClick={() => {
                                        setEditingLink(event.id);
                                        setNewLink(event.meetingLink || "");
                                      }}
                                   >
                                      <LinkIcon size={12} /> {event.meetingLink ? "Modifica Link" : "Aggiungi Meeting"}
                                   </Button>
                                 )}
                               </div>

                               <Link href={`/dashboard/events/${event.id}`} className="w-full sm:w-auto">
                                  <Button className="w-full sm:w-auto rounded-full px-5 h-10 gap-2 bg-slate-950 hover:bg-emerald-500 transition-all text-xs font-bold text-white">
                                     Dettagli <ArrowUpRight size={14} />
                                  </Button>
                               </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200"
                >
                   <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                      <Zap size={40} />
                   </div>
                   <h3 className="text-xl font-display font-bold italic text-slate-950 mb-2">Ancora nulla qui</h3>
                   <p className="text-slate-400 mb-8 max-w-sm mx-auto">Crea il tuo primo evento Smart Interview per incontrare nuovi talenti.</p>
                   <Link href="/dashboard/events/new">
                     <Button className="rounded-full gap-2 px-8 h-12 shadow-xl shadow-emerald-500/10 bg-emerald-500 hover:bg-emerald-600 font-display font-bold italic">
                        <Plus size={18} /> Inizia ora
                     </Button>
                   </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 border-slate-100 disabled:opacity-30"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </Button>
                <div className="px-4 h-10 bg-white border border-slate-100 rounded-xl flex items-center">
                  <span className="text-xs font-black text-slate-950">{currentPage} / {totalPages}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 border-slate-100 disabled:opacity-30"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Partecipanti */}
      <AnimatePresence>
        {viewingParticipants && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setViewingParticipants(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="bg-white rounded-[2.5rem] p-0 max-w-lg w-full shadow-2xl relative overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-8 bg-slate-50/50 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-display italic font-bold text-slate-950 leading-none">Iscritti</h2>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2 truncate max-w-[300px]">
                    {viewingParticipants.title}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewingParticipants(null)}
                  className="rounded-full hover:bg-slate-100"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
                {loadingParticipants ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-emerald-500 size-8" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Caricamento...</p>
                  </div>
                ) : participants.length > 0 ? (
                  participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                      <div className="w-11 h-11 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-white shadow-sm relative">
                        {(p.photoUrl || p.image) ? (
                          <Image 
                            src={(p.photoUrl || p.image) as string} 
                            alt={p.name || "Participant"} 
                            fill
                            className="object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <Users size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-950 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-tight">{p.title || "Professionista"}</p>
                      </div>
                      <Link 
                        href={`/profile/${p.id}`}
                        className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:shadow-sm transition-all border border-slate-100"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <Users size={32} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Nessun iscritto.</p>
                  </div>
                )}
              </div>

              <div className="p-8 pt-0 mt-2">
                <Button 
                  className="w-full rounded-full h-14 bg-slate-950 font-bold text-sm"
                  onClick={() => setViewingParticipants(null)}
                >
                  Chiudi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
