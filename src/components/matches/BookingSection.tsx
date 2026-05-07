"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Check, Plus, Video, Download, Loader2, Trash2, CalendarRange, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { proposeSlots, confirmSlot } from "@/app/actions/booking";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";

interface Slot {
  id?: string;
  startTime: Date;
  endTime: Date;
  isAccepted?: boolean;
}

interface BookingSectionProps {
  matchId: string;
  role: "professional" | "company";
  proposedSlots: Slot[];
  scheduledAt: Date | null;
  meetingLink: string | null;
  hasReviewed: boolean;
  targetId: string;
  targetName: string;
}

export function BookingSection({ 
  matchId, 
  role, 
  proposedSlots: initialSlots, 
  scheduledAt, 
  meetingLink,
  hasReviewed,
  targetId,
  targetName
}: BookingSectionProps) {
  const [formStep, setFormStep] = useState(0); 
  const [newSlots, setNewSlots] = useState<{ date: Date | undefined; time: string }[]>([
    { date: undefined, time: "09:00" }
  ]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [meetingMethod, setMeetingMethod] = useState<"meet" | "custom">("meet");
  const [customMeetingLink, setCustomMeetingLink] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const router = useRouter();

  const handleProposeSlots = async () => {
    if (meetingMethod === "custom" && !customMeetingLink) {
      toast.error("Inserisci un link valido per la chiamata");
      return;
    }

    setIsPending(true);
    try {
      const slotsToSubmit = newSlots
        .filter(s => s.date)
        .map(s => {
          const [h, m] = s.time.split(":");
          const start = new Date(s.date!);
          start.setHours(parseInt(h), parseInt(m), 0, 0);
          const end = new Date(start.getTime() + 30 * 60000);
          return { startTime: start, endTime: end };
        });

      if (slotsToSubmit.length === 0) {
        toast.error("Seleziona almeno una data");
        setIsPending(false);
        return;
      }

      const res = await proposeSlots(
        matchId, 
        slotsToSubmit, 
        meetingMethod === "custom" ? customMeetingLink : undefined
      );
      if (res.error) throw new Error(res.error);
      
      toast.success("Proposta inviata con successo!");
      setFormStep(0); 
      setMeetingMethod("meet");
      setCustomMeetingLink("");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante l'invio";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmSlot = async () => {
    if (!selectedSlotId) return;
    setIsPending(true);
    try {
      const res = await confirmSlot(selectedSlotId);
      if (res.error) throw new Error(res.error);
      
      toast.success("Colloquio confermato!");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante la conferma";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  const downloadICS = () => {
    if (!scheduledAt) return;
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + 30 * 60000);
    const format = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Skillr//NONSGML Event//EN
BEGIN:VEVENT
UID:${matchId}
DTSTAMP:${format(new Date())}
DTSTART:${format(start)}
DTEND:${format(end)}
SUMMARY:Colloquio Skillr
DESCRIPTION:Link Meet: ${meetingLink || 'N/A'}
LOCATION:${meetingLink || 'Google Meet'}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "intervista_skillr.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. CONFIRMED STATE
  if (scheduledAt) {
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + 30 * 60000);
    const activationTime = new Date(startTime.getTime() - 5 * 60000);
    const isActive = now >= activationTime && now < endTime;
    const isCompleted = now >= endTime;

    return (
      <div className="p-6 md:p-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                isCompleted ? "bg-slate-100 text-slate-500" : "bg-emerald-500/10 text-emerald-600"
              )}>
                 {isCompleted ? <Check size={12} strokeWidth={3} /> : <Clock size={12} />} 
                 {isCompleted ? 'Incontro Concluso' : 'Appuntamento Fissato'}
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-display italic font-bold text-slate-950 tracking-tight">
                  {isCompleted ? 'Com\'è andato l\'incontro?' : 'Ci vediamo presto!'}
                </h3>
                <p className="text-slate-500 text-base md:text-lg max-w-xl leading-relaxed">
                  {isCompleted 
                    ? `L'incontro con ${targetName} si è concluso. Lascia un feedback per completare il match.`
                    : `Il tuo incontro è programmato per ${startTime.toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} alle ${startTime.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' })}.`}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full md:w-auto">
               {isCompleted ? (
                 !hasReviewed && (
                    <Button 
                      onClick={() => setIsReviewOpen(true)}
                      className="rounded-2xl h-16 px-10 text-xl font-display italic font-bold shadow-premium bg-slate-950 hover:bg-emerald-600 transition-all gap-3"
                    >
                      <Sparkles size={24} className="text-amber-400" />
                      Lascia Feedback
                    </Button>
                 )
               ) : (
                 meetingLink && (
                   <a 
                     href={isActive ? meetingLink : undefined} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className={cn(
                       buttonVariants({ variant: "default" }),
                       "rounded-2xl h-14 px-8 text-base font-bold gap-3 flex items-center justify-center transition-all",
                       isActive 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                        : "bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                     )}
                   >
                     <Video size={20} /> {isActive ? 'Entra in Meet' : 'Link non ancora attivo'}
                   </a>
                 )
               )}
               {!isCompleted && (
                 <Button 
                   variant="outline" 
                   onClick={downloadICS} 
                   className="rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 h-14 px-8 text-base font-bold gap-3 bg-white"
                 >
                   <Download size={20} /> Calendario
                 </Button>
               )}
            </div>
          </div>
        </motion.div>

        <ReviewDialog
          isOpen={isReviewOpen}
          onClose={() => {
              setIsReviewOpen(false);
              router.refresh();
          }}
          matchId={matchId}
          targetId={targetId}
          targetName={targetName}
        />
      </div>
    );
  }

  // 2. COMPANY VIEW (PROPOSE SLOTS)
  if (role === "company" && initialSlots.length === 0) {
    return (
      <div className="p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          {formStep === 0 ? (
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
                   Scheduling
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-display italic font-bold text-slate-950 tracking-tight">
                    Pianifica la tua call conoscitiva
                  </h3>
                  <p className="text-slate-500 text-base md:text-lg max-w-xl leading-relaxed font-medium">
                    Proponi fino a 3 slot orari. Il match verrà ufficializzato appena lo slot verrà confermato.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setFormStep(1)} 
                className="rounded-2xl px-10 h-16 text-xl font-display italic font-bold shadow-premium gap-3 bg-slate-950 hover:bg-emerald-600 transition-all"
              >
                <CalendarRange size={24} />
                Proponi Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setFormStep(formStep - 1)}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-950 transition-all"
                    >
                      <Plus size={18} className="rotate-45" />
                    </button>
                    <div>
                      <h4 className="text-xl font-display italic font-bold text-slate-950">
                        {formStep === 1 ? "Selezione Disponibilità" : "Metodo Incontro"}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {formStep} di 2</p>
                    </div>
                 </div>
                 <div className="hidden sm:flex gap-1.5">
                    {[1, 2].map(s => (
                      <div key={s} className={cn("w-8 h-1.5 rounded-full transition-all duration-500", formStep >= s ? "bg-emerald-500" : "bg-slate-100")} />
                    ))}
                 </div>
              </div>

              <AnimatePresence mode="wait">
                {formStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newSlots.map((s, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:border-emerald-100 transition-all">
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">{idx + 1}</div>
                                <span className="text-lg font-display italic font-bold text-slate-950">Disponibilità</span>
                              </div>
                              {newSlots.length > 1 && (
                                <button onClick={() => setNewSlots(newSlots.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Data</Label>
                                <DatePicker
                                  value={s.date}
                                  onChange={(date) => {
                                    const updated = [...newSlots];
                                    updated[idx].date = date;
                                    setNewSlots(updated);
                                  }}
                                  disablePast
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Orario</Label>
                                <TimePicker
                                  value={s.time}
                                  onChange={(time) => {
                                    const updated = [...newSlots];
                                    updated[idx].time = time;
                                    setNewSlots(updated);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {newSlots.length < 3 && (
                        <button onClick={() => setNewSlots([...newSlots, { date: undefined, time: "09:00" }])} className="h-full min-h-[200px] rounded-3xl border-2 border-dashed border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-3 group text-slate-400 hover:text-emerald-600 bg-slate-50/50">
                          <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                             <Plus size={24} className="opacity-40 group-hover:opacity-100" />
                          </div>
                          <span className="font-display italic font-bold text-lg">Aggiungi slot</span>
                        </button>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Button onClick={() => { if (newSlots.some(s => !s.date)) { toast.error("Inserisci tutte le date"); return; } setFormStep(2); }} className="rounded-2xl px-16 h-16 text-xl font-display italic font-bold shadow-premium bg-slate-950 hover:bg-emerald-600 transition-all">
                        Continua
                      </Button>
                    </div>
                  </motion.div>
                )}

                {formStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10 max-w-3xl mx-auto"
                  >
                    <div className="grid sm:grid-cols-2 gap-6">
                       <button onClick={() => setMeetingMethod("meet")} className={cn("p-8 rounded-[2.5rem] text-left border-2 transition-all space-y-4 group relative overflow-hidden", meetingMethod === "meet" ? "border-emerald-500 bg-emerald-50/50 shadow-premium" : "border-slate-100 bg-white hover:border-emerald-200")}>
                         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", meetingMethod === "meet" ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600")}>
                           <Video size={24} />
                         </div>
                         <div>
                           <p className="font-display italic font-bold text-xl text-slate-950">Google Meet</p>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">Link generato in automatico.</p>
                         </div>
                         {meetingMethod === "meet" && <Check className="absolute top-6 right-6 text-emerald-600" size={20} strokeWidth={3} />}
                       </button>

                       <button onClick={() => setMeetingMethod("custom")} className={cn("p-8 rounded-[2.5rem] text-left border-2 transition-all space-y-4 group relative overflow-hidden", meetingMethod === "custom" ? "border-emerald-500 bg-emerald-50/50 shadow-premium" : "border-slate-100 bg-white hover:border-emerald-200")}>
                         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", meetingMethod === "custom" ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600")}>
                           <Calendar size={24} />
                         </div>
                         <div>
                           <p className="font-display italic font-bold text-xl text-slate-950">Link Esterno</p>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">Zoom, Teams o altro.</p>
                         </div>
                         {meetingMethod === "custom" && <Check className="absolute top-6 right-6 text-emerald-600" size={20} strokeWidth={3} />}
                       </button>
                    </div>

                    <AnimatePresence>
                      {meetingMethod === "custom" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">URL Chiamata</Label>
                          <input type="url" placeholder="https://zoom.us/j/..." value={customMeetingLink} onChange={(e) => setCustomMeetingLink(e.target.value)} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-950" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-center pt-4">
                      <Button onClick={handleProposeSlots} disabled={isPending} className="rounded-2xl px-20 h-16 text-xl font-display italic font-bold shadow-premium bg-slate-950 hover:bg-emerald-600 transition-all">
                        {isPending ? <Loader2 className="animate-spin" /> : "Invia Proposta"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. WAITING STATE (FOR COMPANY)
  if (role === "company" && initialSlots.length > 0) {
    return (
      <div className="p-8 md:p-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                 <Check size={12} strokeWidth={3} /> Proposta Inviata
              </div>
              <h3 className="text-3xl md:text-4xl font-display italic font-bold text-slate-950 tracking-tight">Proposta inviata!</h3>
              <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed font-medium">
                Le tue disponibilità sono state inviate. Riceverai una notifica appena lo slot verrà confermato.
              </p>
           </div>

           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-3xl mx-auto">
             {initialSlots.map((slot, idx) => (
               <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Opzione {idx + 1}</p>
                 <p className="text-lg font-bold text-slate-950">{new Date(slot.startTime).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</p>
                 <p className="text-sm font-medium text-slate-500">{new Date(slot.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
               </div>
             ))}
           </div>

           {meetingLink && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-md mx-auto p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3"
             >
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dettagli Incontro</p>
               <div className="flex items-center justify-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500">
                    <Video size={20} />
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-slate-950">Link Call Generato</p>
                    <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline font-medium break-all">
                      {meetingLink}
                    </a>
                 </div>
               </div>
             </motion.div>
           )}
        </div>
      </div>
    );
  }

  // 4. SELECTION STATE (FOR PROFESSIONAL)
  if (role === "professional" && initialSlots.length > 0 && !scheduledAt) {
    return (
      <div className="p-8 md:p-16">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
               Scheduling
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl md:text-5xl font-display italic font-bold text-slate-950 tracking-tight">
                Quando sei disponibile?
              </h3>
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                L&apos;azienda ha proposto questi slot {meetingLink ? "per un incontro su Google Meet" : ""}. Seleziona quello che preferisci per confermare.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initialSlots.map((slot) => (
              <motion.button
                key={slot.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSlotId(slot.id || null)}
                className={cn(
                  "relative p-10 rounded-[3rem] border-2 text-left transition-all duration-500 group overflow-hidden",
                  selectedSlotId === slot.id 
                    ? "border-emerald-500 bg-emerald-50 shadow-premium" 
                    : "border-slate-100 bg-white hover:border-emerald-200 hover:shadow-xl"
                )}
              >
                <div className="space-y-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data Incontro</p>
                    <p className="text-3xl font-display italic font-bold text-slate-950">
                      {new Date(slot.startTime).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Orario</p>
                    <p className="text-2xl font-bold text-slate-600">
                      {new Date(slot.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {selectedSlotId === slot.id && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-8 right-8 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                  >
                    <Check size={20} strokeWidth={3} />
                  </motion.div>
                )}

                <div className={cn(
                  "absolute -bottom-12 -right-12 w-32 h-32 rounded-full transition-all duration-700",
                  selectedSlotId === slot.id ? "bg-emerald-100/50 scale-150" : "bg-slate-50 opacity-0 group-hover:opacity-100"
                )} />
              </motion.button>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              onClick={handleConfirmSlot} 
              disabled={!selectedSlotId || isPending} 
              className="rounded-[2rem] px-20 h-20 text-2xl font-display italic font-bold shadow-premium bg-slate-950 hover:bg-emerald-600 transition-all gap-4"
            >
              {isPending ? <Loader2 className="animate-spin" /> : (
                <>
                  <Check size={28} strokeWidth={2.5} />
                  Conferma Incontro
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. NO SLOTS STATE (FOR PROFESSIONAL)
  if (role === "professional" && initialSlots.length === 0) {
    return (
      <div className="p-12 md:p-24 text-center">
        <div className="max-w-md mx-auto space-y-6">
           <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto text-slate-400">
              <Calendar size={32} strokeWidth={1.5} />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-display italic font-bold text-slate-950">In attesa dell&apos;azienda</h3>
             <p className="text-slate-500 text-lg leading-relaxed font-medium">L&apos;azienda non ha ancora proposto degli slot. Riceverai una notifica appena potrai scegliere l&apos;orario.</p>
           </div>
        </div>
      </div>
    );
  }

  return null;
}
