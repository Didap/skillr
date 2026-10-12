"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Zap,
  Share2,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  X,
  Globe,
  ChevronRight,
  Video,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import {
  bookInterviewAction,
  cancelInterviewBookingAction,
  updateInterviewEventAction,
  deleteInterviewEventAction,
  getEventParticipantsAction,
  updateMeetingLinkAction,
} from "@/app/actions/interviews";
import { formatEventDay, formatEventTime, isSafeHttpUrl } from "@/components/interviews/event-time";
import { SeatCount } from "@/components/interviews/SeatCount";
import { ConfirmSheet } from "@/components/interviews/ConfirmSheet";
import { ParticipantList, type Participant } from "@/components/interviews/ParticipantList";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { InterviewEvent } from "@/types/interview";
import { duration, ease, haptic, spring } from "@/lib/motion";

interface EventDetailClientProps {
  event: InterviewEvent & {
    companyName?: string;
    companyImage?: string | null;
    companyDescription?: string | null;
    companyWebsite?: string | null;
  };
  isBooked: boolean;
  isProfessional: boolean;
  isOwner: boolean;
  isPast: boolean;
}

export default function EventDetailClient({ event: initialEvent, isBooked, isProfessional, isOwner, isPast }: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(isBooked);
  const [isEditing, setIsEditing] = useState(false);
  const [confirming, setConfirming] = useState<"cancel" | "delete" | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState("");

  const closeConfirm = useCallback(() => setConfirming(null), []);
  const closeParticipants = useCallback(() => setParticipantsOpen(false), []);
  const closeLink = useCallback(() => setLinkOpen(false), []);

  // Escape closes the full-screen editor
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsEditing(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isEditing]);

  if (!event) return null;

  const handleBooking = async () => {
    if (!isProfessional) {
      toast.error("Solo i professionisti possono iscriversi agli eventi.");
      return;
    }

    setLoading(true);
    const res = await bookInterviewAction(event.id);
    if (res.success) {
      setBooked(true);
      setEvent({ ...event, bookingCount: (event.bookingCount || 0) + 1, meetingLink: res.meetingLink ?? null });
      haptic();
      toast.success("Iscrizione completata con successo!");
    } else {
      toast.error(res.error || "Errore durante l'iscrizione");
    }
    setLoading(false);
  };

  // Confirmed from the sheet
  const handleCancelBooking = async () => {
    setLoading(true);
    const res = await cancelInterviewBookingAction(event.id);
    if (res.success) {
      setBooked(false);
      setEvent({ ...event, bookingCount: Math.max(0, (event.bookingCount || 0) - 1), meetingLink: null });
      setConfirming(null);
      toast.success("Prenotazione annullata.");
    } else {
      toast.error(res.error || "Errore durante l'annullamento");
    }
    setLoading(false);
  };

  const shareEvent = async () => {
    const url = window.location.href;
    // Native share sheet on phones, clipboard elsewhere
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: event.title, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    navigator.clipboard.writeText(url);
    toast.success("Link copiato negli appunti!");
  };

  const handleUpdate = async (data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) => {
    setLoading(true);
    const res = await updateInterviewEventAction(event.id, data);
    if (res.success) {
      setEvent({ ...event, ...res.data });
      setIsEditing(false);
      toast.success("Evento aggiornato con successo!");
    } else {
      toast.error(res.error || "Errore durante l'aggiornamento");
    }
    setLoading(false);
  };

  // Confirmed from the sheet
  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteInterviewEventAction(event.id);
    if (res.success) {
      toast.success("Evento eliminato.");
      router.push("/dashboard/events");
    } else {
      toast.error(res.error || "Errore durante l'eliminazione");
      setLoading(false);
    }
  };

  const openParticipants = async () => {
    setParticipantsOpen(true);
    setLoadingParticipants(true);
    const res = await getEventParticipantsAction(event.id);
    if (res.success) {
      setParticipants(res.data || []);
    } else {
      toast.error(res.error || "Errore nel caricamento dei partecipanti");
    }
    setLoadingParticipants(false);
  };

  const openLinkEditor = () => {
    setNewLink(event.meetingLink || "");
    setLinkOpen(true);
  };

  const handleUpdateLink = async () => {
    if (!newLink) return;
    setLoading(true);
    const res = await updateMeetingLinkAction(event.id, newLink);
    if (res.success) {
      setEvent({ ...event, meetingLink: newLink });
      setLinkOpen(false);
      toast.success("Link aggiornato con successo!");
    } else {
      toast.error(res.error || "Errore durante l'aggiornamento");
    }
    setLoading(false);
  };

  // Formatted in Italian time so the server-rendered and hydrated text match
  const eventDate = event.date ? new Date(event.date) : null;
  const validDate = eventDate && !isNaN(eventDate.getTime()) ? eventDate : null;
  const dateStr = validDate ? formatEventDay(validDate) : "Data non disponibile";
  const timeStr = validDate ? formatEventTime(validDate) : "--:--";
  const endTimeStr = event.endTime ? formatEventTime(event.endTime) : null;
  const bookingCount = event.bookingCount || 0;
  const isFull = bookingCount >= (event.maxSlots || 0);
  const fillPct = Math.min(100, (bookingCount / (event.maxSlots || 1)) * 100);
  // The link only reaches the client for the organizer and booked professionals
  const meetingLink = (booked || isOwner) && isSafeHttpUrl(event.meetingLink) ? event.meetingLink : null;
  const backHref = isProfessional ? "/dashboard/smart-interviews" : "/dashboard/events";

  const progressBar = (track: string) => (
    <div className={`w-full h-1.5 rounded-full overflow-hidden ${track}`} aria-hidden="true">
      <div
        className="h-full bg-emerald-500 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${fillPct}%` }}
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <PageHeader
        title={event.title}
        subtitle={isOwner ? "Gestione evento" : "Sessione di matching rapido"}
        backHref={backHref}
        actions={
          <>
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="pressable hidden md:inline-flex rounded-xl h-11 px-4 border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest gap-2"
                >
                  <Pencil size={14} /> Modifica
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirming("delete")}
                  className="pressable hidden md:inline-flex rounded-xl h-11 px-4 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold text-xs uppercase tracking-widest gap-2"
                >
                  <Trash2 size={14} /> Elimina
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={shareEvent}
              aria-label="Condividi evento"
              className="pressable w-11 h-11 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
            >
              <Share2 size={19} />
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-tabbar">
        {/* Phone hero: full-bleed cover, then the facts as a list */}
        <section className="md:hidden">
          <div className="relative aspect-16/10 rounded-b-[2rem] overflow-hidden bg-slate-950">
            {event.imageUrl ? (
              <Image src={event.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full" />
                <div className="relative w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
                  <Zap size={30} fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pt-5 space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 max-w-full justify-start">
                  {event.topic || "Matching"}
                </Badge>
                {event.format && (
                  <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider px-2.5 py-0.5 max-w-full justify-start">
                    {event.format}
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-display italic font-bold leading-tight text-slate-950 text-balance">{event.title}</h2>
            </div>

            <dl className="rounded-3xl ring-1 ring-slate-100 divide-y divide-slate-100 bg-white">
              <div className="flex items-start gap-3 p-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Calendar size={18} /></span>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-slate-500">Data e ora</dt>
                  <dd className="text-[15px] font-semibold text-slate-950 first-letter:uppercase">
                    {dateStr}, {timeStr}{endTimeStr && ` – ${endTimeStr}`}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><MapPin size={18} /></span>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-slate-500">Luogo</dt>
                  <dd className="text-[15px] font-semibold text-slate-950 wrap-break-word">{event.location || "Online Session"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Users size={18} /></span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Posti</dt>
                    <dd className="text-[15px] font-semibold text-slate-950 tabular-nums">
                      <SeatCount value={bookingCount} /> / {event.maxSlots} partecipanti
                    </dd>
                  </div>
                  {progressBar("bg-slate-100")}
                </div>
              </div>
            </dl>

            {meetingLink && (
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[15px] font-bold"
              >
                <Video size={18} /> Entra nel meeting <ExternalLink size={15} />
              </a>
            )}
          </div>
        </section>

        <main className="max-w-6xl w-full mx-auto px-4 pt-8 pb-6 md:p-8 lg:p-12">
          {/* Desktop hero */}
          <div className="hidden md:flex mb-12 p-8 md:p-12 bg-slate-950 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border border-white/5 min-h-[400px] items-end">
            {event.imageUrl && (
              <>
                <Image
                  src={event.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 1100px, 100vw"
                  className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-3000 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/80 to-slate-950/20 z-10" />
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/50 to-transparent z-10" />
              </>
            )}

            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-1000 group-hover:scale-110" />

            <div className="relative z-20 flex flex-col lg:flex-row justify-between items-end w-full gap-12">
              <div className="space-y-8 flex-1 min-w-0">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 shrink-0 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-white/10 shadow-2xl">
                    <Zap size={40} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-4xl md:text-5xl font-display italic font-bold leading-tight tracking-tight">{event.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[10px] uppercase tracking-widest px-3">
                         {event.topic || "Matching"}
                       </Badge>
                       <Badge variant="outline" className="border-white/10 text-white/60 font-bold text-[10px] uppercase tracking-widest">
                         {event.format || "Standard"}
                       </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 text-slate-300">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Data e Ora</p>
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <Calendar size={20} className="text-emerald-500" />
                      <span className="capitalize">{dateStr} alle {timeStr}{endTimeStr && ` – ${endTimeStr}`}</span>
                    </div>
                    {meetingLink && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-bold hover:bg-emerald-500/25 transition-colors"
                      >
                        <Video size={16} /> Entra nel meeting <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Luogo / Link</p>
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <MapPin size={20} className="text-emerald-500" />
                      <span>{event.location || "Online Session"}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Disponibilità</p>
                    <div className="flex items-center gap-2 text-lg font-medium tabular-nums">
                      <Users size={20} className="text-emerald-500" />
                      <span><SeatCount value={bookingCount} /> / {event.maxSlots} Partecipanti</span>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-4 border-t border-white/5 max-w-3xl">
                    <p className="text-slate-400 text-lg leading-relaxed font-medium italic line-clamp-4">
                      &quot;{event.description}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full lg:w-80 shrink-0">
                <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl text-white">
                   <div className="space-y-6">
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Stato Iscrizioni</p>
                         <h3 className="text-2xl font-display italic font-bold">{isPast ? "Evento concluso" : "Posti Disponibili"}</h3>
                      </div>

                      {isOwner ? (
                        <Button className="pressable w-full h-14 rounded-2xl text-sm font-bold bg-white text-slate-950 hover:bg-emerald-400 transition-all shadow-lg" onClick={openParticipants}>
                          Gestisci Iscritti <ChevronRight size={18} />
                        </Button>
                      ) : booked ? (
                        <div className="space-y-3">
                          <div className="w-full h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-3 font-bold shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={20} /> Iscritto
                          </div>
                          {!isPast && (
                            <Button
                              variant="ghost"
                              onClick={() => setConfirming("cancel")}
                              disabled={loading}
                              className="w-full h-11 rounded-2xl text-sm font-bold text-slate-400 hover:text-red-300 hover:bg-white/5"
                            >
                              Annulla prenotazione
                            </Button>
                          )}
                        </div>
                      ) : isPast ? (
                        <div className="w-full h-14 rounded-2xl bg-white/10 text-slate-400 flex items-center justify-center font-bold border border-white/10">
                          Evento concluso
                        </div>
                      ) : (
                        <Button
                          onClick={handleBooking}
                          disabled={loading || isFull}
                          className="pressable w-full h-14 rounded-2xl text-base font-bold bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 border-none"
                        >
                          {loading ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : isFull ? "Posti Esauriti" : "Riserva un posto"}
                        </Button>
                      )}

                      <div className="pt-4 space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                           <span>Occupazione</span>
                           <span className="tabular-nums">{Math.round(fillPct)}%</span>
                         </div>
                         {progressBar("bg-white/10")}
                      </div>
                   </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Secondary info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 md:space-y-10">
               <div className="space-y-3 md:space-y-6">
                  <h3 className="text-xl md:text-2xl font-display italic font-bold text-slate-950">Dettagli della sessione</h3>
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed whitespace-pre-wrap font-medium wrap-break-word">
                    {event.description || "Nessuna descrizione aggiuntiva fornita."}
                  </p>
               </div>

               {!!event.tags?.length && (
                 <div className="space-y-3 md:space-y-6">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-500">Competenze Richieste / Topic</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="rounded-xl px-3.5 py-2 h-auto bg-slate-50 text-slate-700 border-slate-100 font-bold text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="space-y-5 md:space-y-8">
               {isOwner && (
                 <section aria-label="Strumenti organizzatore" className="rounded-3xl md:rounded-[2.5rem] ring-1 ring-slate-100 bg-white p-2">
                   <button
                     type="button"
                     onClick={openParticipants}
                     className="pressable w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left"
                   >
                     <span className="w-10 h-10 shrink-0 rounded-xl bg-slate-950 text-white flex items-center justify-center"><Users size={18} /></span>
                     <span className="flex-1 min-w-0">
                       <span className="block text-[15px] font-bold text-slate-950">Iscritti</span>
                       <span className="block text-[13px] text-slate-500 tabular-nums"><SeatCount value={bookingCount} /> su {event.maxSlots} posti</span>
                     </span>
                     <ChevronRight size={18} className="text-slate-300" />
                   </button>
                   <button
                     type="button"
                     onClick={openLinkEditor}
                     className="pressable w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left"
                   >
                     <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><LinkIcon size={18} /></span>
                     <span className="flex-1 min-w-0">
                       <span className="block text-[15px] font-bold text-slate-950">Link del meeting</span>
                       <span className="block text-[13px] text-slate-500 truncate">{event.meetingLink || "Non ancora impostato"}</span>
                     </span>
                     <ChevronRight size={18} className="text-slate-300" />
                   </button>
                   <button
                     type="button"
                     onClick={() => setConfirming("delete")}
                     className="pressable md:hidden w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-50 text-left"
                   >
                     <span className="w-10 h-10 shrink-0 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={18} /></span>
                     <span className="flex-1 text-[15px] font-bold text-red-600">Elimina evento</span>
                   </button>
                 </section>
               )}

               <Card className="p-5 md:p-8 gap-0 rounded-3xl md:rounded-[2.5rem] border-slate-50 shadow-card bg-white overflow-hidden group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative shadow-sm shrink-0">
                       {event.companyImage ? (
                         <Image src={event.companyImage} alt="" fill sizes="56px" className="object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl uppercase">
                           {event.companyName?.[0]}
                         </div>
                       )}
                    </div>
                    <div className="min-w-0">
                       <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Organizzatore</p>
                       <h4 className="font-bold text-slate-950 text-lg leading-tight truncate">{event.companyName}</h4>
                    </div>
                  </div>
                  {event.companyWebsite && (
                    <a
                      href={event.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pressable mt-5 md:mt-6 flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 text-slate-600 text-[15px] md:text-sm font-medium hover:bg-white hover:border-slate-100 hover:text-slate-950 transition-colors"
                    >
                       <Globe size={18} className="text-emerald-500" />
                       <span>Sito Aziendale</span>
                       <ChevronRight size={14} className="ml-auto" />
                    </a>
                  )}
               </Card>

               {!isOwner && (
                 <div className="p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-emerald-50/40 border border-emerald-100/50 md:text-center">
                    <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-2">Consiglio Skillr</p>
                    <p className="text-[15px] md:text-sm font-bold text-slate-600 leading-relaxed">
                      Preparati con domande brevi e dirette. Hai poco tempo per fare una grande impressione!
                    </p>
                 </div>
               )}
            </div>
          </div>
        </main>

        {/* Phone action bar: sticks just above the tab bar */}
        <div className="md:hidden sticky bottom-0 z-30 border-t border-slate-100 bg-white/90 backdrop-blur-xl px-4 py-3">
          {isOwner ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openParticipants}
                className="pressable flex-1 h-12 rounded-2xl bg-slate-100 text-slate-900 font-bold text-[15px] inline-flex items-center justify-center gap-2 tabular-nums"
              >
                <Users size={18} /> Iscritti <span className="text-slate-500 font-semibold"><SeatCount value={bookingCount} />/{event.maxSlots}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="pressable flex-1 h-12 rounded-2xl bg-slate-950 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2"
              >
                <Pencil size={17} /> Modifica
              </button>
            </div>
          ) : booked ? (
            isPast ? (
              <div className="h-12 rounded-2xl bg-slate-100 text-slate-500 font-bold text-[15px] flex items-center justify-center">
                Evento concluso
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming("cancel")}
                  disabled={loading}
                  className="pressable h-12 px-4 rounded-2xl bg-red-50 text-red-600 font-bold text-[15px] disabled:opacity-50"
                >
                  Annulla prenotazione
                </button>
                {meetingLink ? (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pressable flex-1 min-w-0 h-12 rounded-2xl bg-emerald-500 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2"
                  >
                    <Video size={18} /> <span className="truncate">Entra</span>
                  </a>
                ) : (
                  <div className="flex-1 min-w-0 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-[15px] inline-flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> Iscritto
                  </div>
                )}
              </div>
            )
          ) : isPast ? (
            <div className="h-12 rounded-2xl bg-slate-100 text-slate-500 font-bold text-[15px] flex items-center justify-center">
              Evento concluso
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="shrink-0 leading-tight">
                <p className="text-[17px] font-bold text-slate-950 tabular-nums">
                  <SeatCount value={bookingCount} /><span className="text-slate-400 font-semibold">/{event.maxSlots}</span>
                </p>
                <p className="text-xs font-semibold text-slate-500">iscritti</p>
              </div>
              <button
                type="button"
                onClick={handleBooking}
                disabled={loading || isFull}
                className="pressable flex-1 h-12 rounded-2xl bg-emerald-500 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                {loading ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" /> : isFull ? "Posti esauriti" : "Riserva un posto"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit: full-screen layer on phones, side panel from md up */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-60 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: duration.state, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: duration.feedback } }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-event-title"
              initial={{ x: "100%" }}
              animate={{ x: 0, transition: spring.sheet }}
              exit={{ x: "100%", transition: { duration: duration.state, ease: ease.in } }}
              className="relative w-full md:max-w-3xl bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="shrink-0 pt-safe border-b border-slate-100 md:border-0">
                <div className="h-14 md:h-auto px-4 md:px-16 md:pt-14 md:pb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id="edit-event-title" className="text-2xl md:text-3xl font-display italic font-bold text-slate-950 truncate">Modifica evento</h2>
                    <p className="hidden md:block text-sm text-slate-400 font-medium mt-2">Gestisci i dettagli della sessione</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    aria-label="Chiudi"
                    className="pressable shrink-0 -mr-2 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
                  >
                    <X size={24} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 md:px-16 md:pt-6 md:pb-16">
                <InterviewForm
                  initialData={event}
                  onSubmit={handleUpdate}
                  loading={loading}
                  buttonText="Salva Modifiche"
                  stickyBar="edge"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmSheet
        open={confirming === "cancel"}
        onClose={closeConfirm}
        onConfirm={handleCancelBooking}
        loading={loading}
        title="Annullare la prenotazione?"
        description="Il posto tornerà disponibile per altri candidati. Potrai prenotare di nuovo finché ci sono posti liberi."
        confirmText="Annulla prenotazione"
      />
      <ConfirmSheet
        open={confirming === "delete"}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        loading={loading}
        title="Eliminare l'evento?"
        description="L'evento verrà eliminato e i candidati iscritti riceveranno un'email di annullamento. L'operazione non si può annullare."
        confirmText="Elimina evento"
      />

      <BottomSheet open={participantsOpen} onClose={closeParticipants} title="Iscritti">
        <p className="-mt-2 mb-4 text-sm text-slate-500 truncate">{event.title}</p>
        <ParticipantList loading={loadingParticipants} participants={participants} />
      </BottomSheet>

      <BottomSheet open={linkOpen} onClose={closeLink} title="Link del meeting">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateLink();
          }}
          className="space-y-4"
        >
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
      </BottomSheet>
    </div>
  );
}
