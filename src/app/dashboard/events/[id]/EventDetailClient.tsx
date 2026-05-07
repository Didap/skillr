"use client";

import { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Zap, 
  Share2, 
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  X,
  Globe,
  ChevronRight,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { bookInterviewAction, updateInterviewEventAction, deleteInterviewEventAction } from "@/app/actions/interviews";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { InterviewEvent } from "@/types/interview";

interface EventDetailClientProps {
  event: InterviewEvent & { 
    companyName?: string; 
    companyImage?: string | null; 
    companyDescription?: string | null;
  }; 
  isBooked: boolean;
  isProfessional: boolean;
  isOwner: boolean;
}

export default function EventDetailClient({ event: initialEvent, isBooked, isProfessional, isOwner }: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(isBooked);
  const [isEditing, setIsEditing] = useState(false);

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
      toast.success("Iscrizione completata con successo!");
    } else {
      toast.error(res.error || "Errore durante l'iscrizione");
    }
    setLoading(false);
  };

  const shareEvent = () => {
    navigator.clipboard.writeText(window.location.href);
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

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo evento?")) return;
    
    setLoading(true);
    const res = await deleteInterviewEventAction(event.id);
    if (res.success) {
      toast.success("Evento eliminato.");
      router.push("/dashboard/events");
    } else {
      toast.error(res.error || "Errore durante l'eliminazione");
    }
    setLoading(false);
  };

  const eventDate = event.date ? new Date(event.date) : new Date();
  const dateStr = !isNaN(eventDate.getTime()) ? format(eventDate, "EEEE d MMMM yyyy", { locale: it }) : "Data non disponibile";
  const timeStr = !isNaN(eventDate.getTime()) ? format(eventDate, "HH:mm") : "--:--";

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={isProfessional ? "/dashboard/smart-interviews" : "/dashboard/events"}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">{event.title}</h1>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">
              {isOwner ? "Gestione Evento" : "Sessione Matching Rapido"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {isOwner && (
             <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl h-11 px-4 border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest gap-2"
                >
                  <Pencil size={14} /> Modifica
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDelete}
                  className="rounded-xl h-11 px-4 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold text-xs uppercase tracking-widest gap-2"
                >
                  <Trash2 size={14} /> Elimina
                </Button>
             </div>
           )}
           <Button variant="ghost" size="icon" onClick={shareEvent} className="rounded-full hover:bg-slate-50">
             <Share2 size={18} />
           </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-6xl w-full mx-auto p-8 lg:p-12">
          
          <div className="mb-12 p-8 md:p-12 bg-slate-950 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border border-white/5 min-h-[400px] flex items-end">
            {event.imageUrl && (
              <>
                <Image 
                  src={event.imageUrl} 
                  alt={event.title}
                  fill
                  className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-3000 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/80 to-slate-950/20 z-10" />
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/50 to-transparent z-10" />
              </>
            )}

            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-1000 group-hover:scale-110" />
            
            <div className="relative flex flex-col lg:flex-row justify-between items-end w-full gap-12">
              <div className="space-y-8 flex-1">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-white/10 shadow-2xl">
                    <Zap size={40} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-5xl font-display italic font-bold leading-tight tracking-tight">{event.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                       <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[10px] uppercase tracking-widest px-3">
                         {event.topic || "Matching"}
                       </Badge>
                       <Badge variant="outline" className="border-white/10 text-white/50 font-bold text-[10px] uppercase tracking-widest">
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
                      <span className="capitalize">{dateStr} alle {timeStr}</span>
                    </div>
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
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <Users size={20} className="text-emerald-500" />
                      <span>{event.bookingCount || 0} / {event.maxSlots} Partecipanti</span>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-4 border-t border-white/5 max-w-3xl">
                    <p className="text-slate-400 text-lg leading-relaxed font-medium italic">
                      &quot;{event.description}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:w-80 shrink-0">
                <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl">
                   <div className="space-y-6">
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Stato Iscrizioni</p>
                         <h3 className="text-2xl font-display italic font-bold">Posti Disponibili</h3>
                      </div>

                      {booked ? (
                        <div className="w-full h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-3 font-bold shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 size={20} /> Iscritto
                        </div>
                      ) : isOwner ? (
                        <Button className="w-full h-14 rounded-2xl text-sm font-bold bg-white text-slate-950 hover:bg-emerald-400 transition-all shadow-lg" onClick={() => router.push("/dashboard/events")}>
                          Gestisci Iscritti <ChevronRight size={18} />
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleBooking}
                          disabled={loading || (event.bookingCount || 0) >= (event.maxSlots || 0)}
                          className="w-full h-14 rounded-2xl text-base font-bold bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 border-none"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : (event.bookingCount || 0) >= (event.maxSlots || 0) ? "Posti Esauriti" : "Riserva un posto"}
                        </Button>
                      )}

                      <div className="pt-4 space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                           <span>Occupazione</span>
                           <span>{Math.round(((event.bookingCount || 0) / (event.maxSlots || 1)) * 100)}%</span>
                         </div>
                         <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-emerald-500 transition-all duration-1000" 
                             style={{ width: `${Math.min(100, ((event.bookingCount || 0) / (event.maxSlots || 1)) * 100)}%` }} 
                           />
                         </div>
                      </div>
                   </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Secondary Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Description & Tags */}
            <div className="lg:col-span-2 space-y-10">
               <div className="space-y-6">
                  <h3 className="text-2xl font-display italic font-bold text-slate-950">Dettagli della sessione</h3>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {event.description || "Nessuna descrizione aggiuntiva fornita."}
                    </p>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Competenze Richieste / Topic</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="rounded-xl px-4 py-2 bg-slate-50 text-slate-600 border-slate-100 font-bold">
                        {tag}
                      </Badge>
                    ))}
                  </div>
               </div>
            </div>

            {/* Right Col: Organizer & Meta */}
            <div className="space-y-8">
               <Card className="p-8 rounded-[2.5rem] border-slate-50 shadow-card bg-white overflow-hidden group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative shadow-sm shrink-0">
                       {event.companyImage ? (
                         <Image src={event.companyImage} alt={event.companyName || "Azienda"} fill className="object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl uppercase">
                           {event.companyName?.[0]}
                         </div>
                       )}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Organizzatore</p>
                       <h4 className="font-bold text-slate-950 text-lg leading-tight">{event.companyName}</h4>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 text-slate-600 text-sm font-medium">
                        <Globe size={18} className="text-emerald-500" />
                        <span>Sito Aziendale</span>
                        <ChevronRight size={14} className="ml-auto" />
                     </div>
                     <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 text-slate-600 text-sm font-medium">
                        <Video size={18} className="text-emerald-500" />
                        <span>Supporto Live</span>
                     </div>
                  </div>
               </Card>

               <div className="p-8 rounded-[2.5rem] bg-emerald-50/30 border border-emerald-100/50 text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Consiglio Skillr</p>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">
                    Preparati con domande brevi e dirette. Hai poco tempo per fare una grande impressione!
                  </p>
               </div>
            </div>

          </div>
        </main>
      </div>

      {/* Edit Overlay */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto"
            >
              <div className="p-10 md:p-16">
                <div className="flex items-center justify-between mb-12">
                   <div>
                     <h2 className="text-3xl font-display italic font-bold text-slate-950">Modifica Evento</h2>
                     <p className="text-sm text-slate-400 font-medium mt-2">Gestisci i dettagli della sessione</p>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="w-12 h-12 rounded-full hover:bg-slate-100">
                     <X size={28} strokeWidth={1.5} />
                   </Button>
                </div>
                <InterviewForm 
                  initialData={event}
                  onSubmit={handleUpdate}
                  loading={loading}
                  buttonText="Salva Modifiche"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
