"use client";

import { useState } from "react";
import { 
  Zap, 
  Plus, 
  Calendar, 
  Users, 
  Link as LinkIcon, 
  X, 
  ArrowLeft,
  Clock,
  Video,
  ExternalLink,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { InterviewEvent } from "@/types/interview";
import { createInterviewEventAction, updateMeetingLinkAction, getEventParticipantsAction } from "@/app/actions/interviews";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

interface EventsClientProps {
  initialEvents: InterviewEvent[];
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const [events, setEvents] = useState<InterviewEvent[]>(initialEvents);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [newLink, setNewLink] = useState("");
  const [viewingParticipants, setViewingParticipants] = useState<InterviewEvent | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const handleCreate = async (data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) => {
    setLoading(true);
    const res = await createInterviewEventAction(data);
    if (res.success) {
      setEvents([res.data as InterviewEvent, ...events]);
      setIsCreating(false);
      toast.success("Evento creato con successo!");
    } else {
      toast.error(res.error || "Errore durante la creazione");
    }
    setLoading(false);
  };

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
    <div className="flex-1 flex flex-col min-h-screen bg-[#FDFDFC]">
      {/* Header */}
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Smart Interviews</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Gestione Eventi Speed-Dating</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setIsCreating(true)}
          className="rounded-full gap-2 shadow-lg shadow-primary/20 h-12 px-6 bg-slate-950 hover:bg-slate-800"
        >
          <Plus size={18} /> Nuovo Evento
        </Button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
        {/* Creation Overlay */}
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display italic font-bold text-slate-950">Nuova Smart Interview</h2>
                      <p className="text-xs text-slate-400 font-medium">Configura la tua sessione di matching rapido</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <InterviewForm onSubmit={handleCreate} loading={loading} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Eventi Totali</p>
              <p className="text-2xl font-display font-bold text-slate-950">{events.length}</p>
            </div>
          </Card>
          <Card className="p-6 bg-white border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Partecipanti</p>
              <p className="text-2xl font-display font-bold text-slate-950">
                {events.reduce((acc, curr) => acc + (curr.bookingCount || 0), 0)}
              </p>
            </div>
          </Card>
          <Card className="p-6 bg-slate-950 text-white border-slate-900 rounded-[2rem] shadow-xl flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Posti Confermati</p>
              <p className="text-2xl font-display font-bold text-white">
                {events.reduce((acc, curr) => acc + (curr.bookingCount || 0), 0)} / {events.reduce((acc, curr) => acc + curr.maxSlots, 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display italic font-bold text-slate-950">I tuoi Eventi</h3>
          </div>

          <div className="grid gap-6">
            {events.length > 0 ? (
              events.map((event) => (
                <Card 
                  key={event.id}
                  className="p-8 bg-white border-slate-100 rounded-[2.5rem] shadow-premium hover:shadow-xl transition-all group overflow-hidden relative"
                >
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                      <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-primary transition-colors">
                        {format(new Date(event.date), "MMM", { locale: it })}
                      </span>
                      <span className="text-2xl font-display font-bold text-slate-950">
                        {format(new Date(event.date), "dd")}
                      </span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="text-2xl font-display font-bold text-slate-950">{event.title}</h4>
                          <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3">
                            {event.bookingCount || 0} / {event.maxSlots} posti
                          </Badge>
                        </div>
                        <p className="text-slate-500 line-clamp-2 text-sm">{event.description || "Nessuna descrizione fornita."}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={16} />
                          <span className="text-xs font-bold text-slate-600">
                            {format(new Date(event.date), "HH:mm")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Video size={16} />
                          {event.meetingLink ? (
                            <a 
                              href={event.meetingLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              Link Disponibile <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-amber-600">Link mancante</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Zap size={16} />
                          <span className="text-xs font-bold text-slate-600">{event.format || "Standard"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      {editingLink === event.id ? (
                        <div className="flex flex-col gap-2 w-64">
                          <Input 
                            placeholder="Inserisci link meeting..." 
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateLink(event.id)} disabled={loading} className="flex-1 rounded-xl">
                              {loading ? <Loader2 className="animate-spin size-4" /> : "Salva"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingLink(null)} className="rounded-xl">Annulla</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            className="rounded-full gap-2 border-slate-100 hover:bg-slate-50 text-slate-600"
                            onClick={() => {
                              setEditingLink(event.id);
                              setNewLink(event.meetingLink || "");
                            }}
                          >
                            <LinkIcon size={16} /> {event.meetingLink ? "Modifica Link" : "Aggiungi Link"}
                          </Button>
                          <Button 
                            className="rounded-full gap-2 shadow-card"
                            onClick={() => handleViewParticipants(event)}
                          >
                            <Users size={16} /> Vedi Partecipanti
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                    <Zap size={40} />
                 </div>
                 <h3 className="text-xl font-display font-bold italic text-slate-950 mb-2">Ancora nessun evento</h3>
                 <p className="text-slate-400 mb-8 max-w-sm mx-auto">Organizza la tua prima Smart Interview per incontrare velocemente i migliori talenti.</p>
                 <Button onClick={() => setIsCreating(true)} className="rounded-full gap-2 px-8 h-12 shadow-lg shadow-primary/20">
                    <Plus size={18} /> Crea il primo evento
                 </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {viewingParticipants && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-150 flex items-center justify-center p-4"
            onClick={() => setViewingParticipants(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-display italic font-bold text-slate-950">Partecipanti</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">
                    {viewingParticipants.title} • {viewingParticipants.bookingCount}/{viewingParticipants.maxSlots} posti
                  </p>
                </div>
                <button 
                  onClick={() => setViewingParticipants(null)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                {loadingParticipants ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-primary size-8" />
                    <p className="text-sm text-slate-400 font-medium">Caricamento in corso...</p>
                  </div>
                ) : participants.length > 0 ? (
                  participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-md transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                        {(p.photoUrl || p.image) ? (
                          <img src={p.photoUrl || p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <Users size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-950 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate">{p.title || "Professionista"}</p>
                      </div>
                      <Link 
                        href={`/profile/${p.id}`}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-primary hover:shadow-sm transition-all border border-slate-100"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <Users size={32} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Nessun partecipante ancora iscritto.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <Button 
                  variant="outline" 
                  className="w-full rounded-2xl h-12 border-slate-200 font-bold"
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
