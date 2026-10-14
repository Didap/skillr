"use client";

import { useEffect, useState } from "react";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { toast } from "sonner";
import {
  bookInterviewAction,
  cancelInterviewBookingAction,
  updateInterviewEventAction,
  deleteInterviewEventAction,
} from "@/app/actions/interviews";
import { formatEventDay, formatEventTime, isSafeHttpUrl } from "@/lib/rome-time";
import { SeatCount } from "@/components/interviews/SeatCount";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { ParticipantsSheet } from "@/components/interviews/ParticipantsSheet";
import { MeetingLinkSheet } from "@/components/interviews/MeetingLinkSheet";
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
  const [linkOpen, setLinkOpen] = useState(false);
  const closeConfirm = () => setConfirming(null);

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

  const openParticipants = () => setParticipantsOpen(true);

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
    <div className={`w-full h-2 rounded-full overflow-hidden ${track}`} aria-hidden="true">
      <div
        className="h-full bg-rosso rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${fillPct}%` }}
      />
    </div>
  );

  return (
    <>
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
                  className="hidden md:inline-flex h-11 px-5 gap-2"
                >
                  <Pencil size={16} /> Modifica
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirming("delete")}
                  className="hidden md:inline-flex h-11 px-5 gap-2 hover:bg-rosso-50 hover:text-rosso-700"
                >
                  <Trash2 size={16} /> Elimina
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={shareEvent}
              aria-label="Condividi evento"
              className="pressable w-11 h-11 rounded-full border border-viola bg-white flex items-center justify-center text-viola hover:bg-crema"
            >
              <Share2 size={19} strokeWidth={1.75} />
            </button>
          </>
        }
      />

      <PageBody className="custom-scrollbar bg-white">
        {/* Phone hero: full-bleed cover, then the facts as a list */}
        <section className="md:hidden">
          <div className="relative aspect-16/10 rounded-b-card overflow-hidden bg-blu">
            {event.imageUrl ? (
              <Image src={event.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-rosa flex items-center justify-center text-viola">
                  <Zap size={28} strokeWidth={1.75} />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pt-5 space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="h-7 px-3 text-chip max-w-full justify-start">
                  {event.topic || "Matching"}
                </Badge>
                {event.format && (
                  <Badge variant="outline" className="h-7 px-3 text-chip max-w-full justify-start">
                    {event.format}
                  </Badge>
                )}
              </div>
              <h2 className="text-title font-display text-viola text-balance">{event.title}</h2>
            </div>

            <dl className="rounded-card ring-1 ring-viola/15 bg-white px-5 py-2 divide-y divide-viola/15">
              <div className="flex items-start gap-3 py-3">
                <Calendar size={24} strokeWidth={1.75} className="shrink-0 text-viola mt-1" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-label text-viola">Data e ora</dt>
                  <dd className="text-body font-medium text-viola first-letter:uppercase">
                    {dateStr}, {timeStr}{endTimeStr && ` – ${endTimeStr}`}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <MapPin size={24} strokeWidth={1.75} className="shrink-0 text-viola mt-1" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-label text-viola">Luogo</dt>
                  <dd className="text-body font-medium text-viola wrap-break-word">{event.location || "Online"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <Users size={24} strokeWidth={1.75} className="shrink-0 text-viola mt-1" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <dt className="text-label text-viola">Posti</dt>
                    <dd className="text-body font-medium text-viola tabular-nums">
                      <SeatCount value={bookingCount} /> / {event.maxSlots} partecipanti
                    </dd>
                  </div>
                  {progressBar("bg-crema")}
                </div>
              </div>
            </dl>

            {meetingLink && (
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable flex items-center justify-center gap-2 h-12 rounded-full bg-rosso hover:bg-rosso-600 text-white text-[15px] font-bold"
              >
                <Video size={18} /> Entra nel meeting <ExternalLink size={15} />
              </a>
            )}
          </div>
        </section>

        <main className="max-w-6xl w-full mx-auto px-4 pt-8 pb-6 md:p-8 lg:p-12">
          {/* Desktop hero */}
          <div className="hidden md:block mb-12 p-8 lg:p-10 bg-blu rounded-[2.25rem] text-white">
            <div className="flex flex-col lg:flex-row justify-between lg:items-end w-full gap-10">
              <div className="space-y-8 flex-1 min-w-0">
                <div className="flex items-center gap-6">
                  {event.imageUrl ? (
                    <div className="relative w-40 aspect-16/10 shrink-0 rounded-2xl overflow-hidden bg-blu-700">
                      <Image
                        src={event.imageUrl}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 rounded-full bg-rosa flex items-center justify-center text-viola">
                      <Zap size={36} strokeWidth={1.75} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-display font-display text-white text-balance">{event.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge className="h-7 px-3 text-chip">
                        {event.topic || "Matching"}
                      </Badge>
                      <Badge variant="outline" className="h-7 px-3 text-chip border-transparent">
                        {event.format || "Standard"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-10 gap-y-6">
                  <div className="space-y-1">
                    <p className="text-label text-rosa">Data e ora</p>
                    <div className="flex items-center gap-2 text-body font-medium">
                      <Calendar size={22} strokeWidth={1.75} className="text-rosa" aria-hidden="true" />
                      <span className="first-letter:uppercase">{dateStr} alle {timeStr}{endTimeStr && ` – ${endTimeStr}`}</span>
                    </div>
                    {meetingLink && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pressable inline-flex items-center gap-2 mt-3 px-5 h-11 rounded-full bg-white text-viola text-sm font-bold hover:bg-crema transition-colors"
                      >
                        <Video size={16} /> Entra nel meeting <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-label text-rosa">Luogo</p>
                    <div className="flex items-center gap-2 text-body font-medium">
                      <MapPin size={22} strokeWidth={1.75} className="text-rosa" aria-hidden="true" />
                      <span>{event.location || "Online"}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-label text-rosa">Disponibilità</p>
                    <div className="flex items-center gap-2 text-body font-medium tabular-nums">
                      <Users size={22} strokeWidth={1.75} className="text-rosa" aria-hidden="true" />
                      <span><SeatCount value={bookingCount} /> / {event.maxSlots} partecipanti</span>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-6 border-t border-white/20 max-w-3xl">
                    <p className="font-prompt text-2xl leading-8 font-medium text-white line-clamp-4">
                      &quot;{event.description}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full lg:w-80 shrink-0">
                <Card className="p-6 gap-0 ring-0">
                  <div className="space-y-5">
                    <div>
                      <p className="text-label text-viola-500 mb-1">Iscrizioni</p>
                      <h3 className="text-title font-display text-viola">{isPast ? "Evento concluso" : isFull ? "Posti esauriti" : "Posti disponibili"}</h3>
                    </div>

                    {isOwner ? (
                      <Button className="w-full h-14 text-base gap-2" onClick={openParticipants}>
                        Gestisci iscritti <ChevronRight size={18} />
                      </Button>
                    ) : booked ? (
                      <div className="space-y-2">
                        <div className="w-full h-14 rounded-full bg-rosa text-viola flex items-center justify-center gap-2 font-bold">
                          <CheckCircle2 size={20} /> Iscritto
                        </div>
                        {!isPast && (
                          <Button
                            variant="link"
                            onClick={() => setConfirming("cancel")}
                            disabled={loading}
                            className="w-full h-11 text-sm"
                          >
                            Annulla prenotazione
                          </Button>
                        )}
                      </div>
                    ) : isPast ? (
                      <div className="w-full h-14 rounded-full border border-viola/30 text-viola-500 flex items-center justify-center font-bold">
                        Evento concluso
                      </div>
                    ) : (
                      <Button
                        onClick={handleBooking}
                        disabled={loading || isFull}
                        className="w-full h-14 text-base"
                      >
                        {loading ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : isFull ? "Posti esauriti" : "Riserva un posto"}
                      </Button>
                    )}

                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-label text-viola-500">
                        <span>Occupazione</span>
                        <span className="tabular-nums">{Math.round(fillPct)}%</span>
                      </div>
                      {progressBar("bg-crema")}
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
                  <h3 className="text-title font-display text-viola">Dettagli della sessione</h3>
                  <p className="text-body md:text-lg text-viola leading-relaxed whitespace-pre-wrap wrap-break-word">
                    {event.description || "Nessuna descrizione aggiuntiva fornita."}
                  </p>
               </div>

               {!!event.tags?.length && (
                 <div className="space-y-3 md:space-y-6">
                    <h3 className="text-label text-viola">Competenze e temi</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag: string) => (
                        <Badge key={tag} className="h-auto px-4 py-2 text-chip">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="space-y-5 md:space-y-8">
               {isOwner && (
                 <section aria-label="Strumenti organizzatore" className="rounded-card ring-1 ring-viola/15 bg-white p-2">
                   <button
                     type="button"
                     onClick={openParticipants}
                     className="pressable w-full flex items-center gap-3 p-3 rounded-[1.25rem] hover:bg-crema text-left"
                   >
                     <span className="w-10 h-10 shrink-0 rounded-full bg-blu text-white flex items-center justify-center"><Users size={18} strokeWidth={1.75} /></span>
                     <span className="flex-1 min-w-0">
                       <span className="block text-body font-bold text-viola">Iscritti</span>
                       <span className="block text-label text-viola-500 tabular-nums"><SeatCount value={bookingCount} /> su {event.maxSlots} posti</span>
                     </span>
                     <ChevronRight size={18} className="text-viola-400" />
                   </button>
                   <button
                     type="button"
                     onClick={() => setLinkOpen(true)}
                     className="pressable w-full flex items-center gap-3 p-3 rounded-[1.25rem] hover:bg-crema text-left"
                   >
                     <span className="w-10 h-10 shrink-0 rounded-full bg-rosa text-viola flex items-center justify-center"><LinkIcon size={18} strokeWidth={1.75} /></span>
                     <span className="flex-1 min-w-0">
                       <span className="block text-body font-bold text-viola">Link del meeting</span>
                       <span className="block text-label text-viola-500 truncate">{event.meetingLink || "Non ancora impostato"}</span>
                     </span>
                     <ChevronRight size={18} className="text-viola-400" />
                   </button>
                   <button
                     type="button"
                     onClick={() => setConfirming("delete")}
                     className="pressable md:hidden w-full flex items-center gap-3 p-3 rounded-[1.25rem] hover:bg-rosso-50 text-left"
                   >
                     <span className="w-10 h-10 shrink-0 rounded-full bg-rosso-50 text-rosso-700 flex items-center justify-center"><Trash2 size={18} strokeWidth={1.75} /></span>
                     <span className="flex-1 text-body font-bold text-rosso-700">Elimina evento</span>
                   </button>
                 </section>
               )}

               <Card className="p-6 gap-0 ring-viola/15">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-viola overflow-hidden relative shrink-0">
                       {event.companyImage ? (
                         <Image src={event.companyImage} alt="" fill sizes="56px" className="object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-rosa font-bold text-2xl uppercase">
                           {event.companyName?.[0]}
                         </div>
                       )}
                    </div>
                    <div className="min-w-0">
                       <p className="text-label text-viola-500 mb-0.5">Organizzatore</p>
                       <h4 className="font-bold text-viola text-lg leading-tight truncate">{event.companyName}</h4>
                    </div>
                  </div>
                  {event.companyWebsite && (
                    <a
                      href={event.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pressable mt-5 flex items-center gap-3 h-12 px-5 rounded-full bg-crema text-viola text-[15px] md:text-sm font-medium hover:bg-rosa transition-colors"
                    >
                       <Globe size={18} strokeWidth={1.75} className="text-viola" />
                       <span>Sito aziendale</span>
                       <ChevronRight size={14} className="ml-auto" />
                    </a>
                  )}
               </Card>

               {!isOwner && (
                 <div className="p-6 rounded-card bg-rosa">
                    <p className="text-label text-viola mb-2">Consiglio Helllo</p>
                    <p className="text-body font-medium text-viola">
                      Preparati con domande brevi e dirette. Hai poco tempo per fare una grande impressione!
                    </p>
                 </div>
               )}
            </div>
          </div>
        </main>

        {/* Phone action bar: sticks just above the tab bar */}
        <div className="md:hidden sticky bottom-0 z-30 border-t border-viola/15 bg-white px-4 py-3">
          {isOwner ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openParticipants}
                className="pressable flex-1 h-12 rounded-full border border-viola bg-white text-viola font-bold text-[15px] inline-flex items-center justify-center gap-2 tabular-nums"
              >
                <Users size={18} /> Iscritti <span className="text-viola-500 font-semibold"><SeatCount value={bookingCount} />/{event.maxSlots}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="pressable flex-1 h-12 rounded-full bg-rosso hover:bg-rosso-600 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2"
              >
                <Pencil size={17} /> Modifica
              </button>
            </div>
          ) : isPast ? (
            <div className="h-12 rounded-full border border-viola/30 text-viola-500 font-bold text-[15px] flex items-center justify-center">
              Evento concluso
            </div>
          ) : booked ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming("cancel")}
                disabled={loading}
                className="pressable h-12 px-4 rounded-full border border-viola bg-white text-viola font-bold text-[15px] disabled:opacity-50"
              >
                Annulla prenotazione
              </button>
              {meetingLink ? (
                <a
                  href={meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable flex-1 min-w-0 h-12 rounded-full bg-rosso hover:bg-rosso-600 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2"
                >
                  <Video size={18} /> <span className="truncate">Entra</span>
                </a>
              ) : (
                <div className="flex-1 min-w-0 h-12 rounded-full bg-rosa text-viola font-bold text-[15px] inline-flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Iscritto
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="shrink-0 leading-tight">
                <p className="text-[17px] font-bold text-viola tabular-nums">
                  <SeatCount value={bookingCount} /><span className="text-viola-400 font-semibold">/{event.maxSlots}</span>
                </p>
                <p className="text-label text-viola-500">iscritti</p>
              </div>
              <button
                type="button"
                onClick={handleBooking}
                disabled={loading || isFull}
                className="pressable flex-1 h-12 rounded-full bg-rosso hover:bg-rosso-600 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:bg-viola-100 disabled:text-viola-500"
              >
                {loading ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" /> : isFull ? "Posti esauriti" : "Riserva un posto"}
              </button>
            </div>
          )}
        </div>
      </PageBody>

      {/* Edit: full-screen layer on phones, side panel from md up */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-60 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: duration.state, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: duration.feedback } }}
              className="absolute inset-0 bg-viola/40"
              onClick={() => setIsEditing(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-event-title"
              initial={{ x: "100%" }}
              animate={{ x: 0, transition: spring.sheet }}
              exit={{ x: "100%", transition: { duration: duration.state, ease: ease.in } }}
              className="relative w-full md:max-w-3xl bg-white h-full shadow-card flex flex-col"
            >
              <div className="shrink-0 pt-safe border-b border-viola/15 md:border-0">
                <div className="h-14 md:h-auto px-4 md:px-16 md:pt-14 md:pb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id="edit-event-title" className="text-2xl md:text-title font-display font-bold text-viola truncate">Modifica evento</h2>
                    <p className="hidden md:block text-body text-viola-500 mt-2">Gestisci i dettagli della sessione</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    aria-label="Chiudi"
                    className="pressable shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full border border-viola bg-white flex items-center justify-center text-viola hover:bg-crema"
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
                  buttonText="Salva modifiche"
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

      <ParticipantsSheet event={participantsOpen ? event : null} onClose={() => setParticipantsOpen(false)} />

      <MeetingLinkSheet
        event={linkOpen ? event : null}
        onClose={() => setLinkOpen(false)}
        onSaved={(link) => setEvent(prev => ({ ...prev, meetingLink: link }))}
      />
    </>
  );
}
