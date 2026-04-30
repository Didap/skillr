"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Check, Plus, Video, Download, Loader2, Trash2, CalendarRange } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { proposeSlots, confirmSlot } from "@/app/actions/booking";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
}

export function BookingSection({ 
  matchId, 
  role, 
  proposedSlots: initialSlots, 
  scheduledAt, 
  meetingLink 
}: BookingSectionProps) {
  const [formStep, setFormStep] = useState(0); // Start at 0 (button view)
  const [newSlots, setNewSlots] = useState<{ date: Date | undefined; time: string }[]>([
    { date: undefined, time: "09:00" }
  ]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [meetingMethod, setMeetingMethod] = useState<"meet" | "custom">("meet");
  const [customMeetingLink, setCustomMeetingLink] = useState("");
  const [isPending, setIsPending] = useState(false);
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
          const end = new Date(start.getTime() + 30 * 60000); // 30 min duration
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
      setFormStep(1); // Reset step
      setMeetingMethod("meet"); // Reset method
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

  // Live timer for meeting activation
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. CONFIRMED STATE
  if (scheduledAt) {
    const startTime = new Date(scheduledAt);
    const activationTime = new Date(startTime.getTime() - 5 * 60000); // 5 min before
    const isActive = now >= activationTime;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 md:p-12 md:pb-16"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
               <Check size={12} strokeWidth={3} /> Appuntamento Fissato
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-display italic font-bold text-emerald-950 tracking-tight">
                Ci vediamo presto!
              </h3>
              <p className="text-emerald-900/60 text-lg md:text-xl max-w-xl leading-relaxed">
                Il tuo incontro è programmato per <span className="font-bold text-emerald-900 border-b-2 border-emerald-200/50 pb-0.5">{startTime.toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span> alle <span className="font-bold text-emerald-900">{startTime.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto text-center md:text-right">
             {meetingLink && (
               <div className="space-y-3">
                 <a 
                   href={isActive ? meetingLink : undefined} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className={cn(
                     buttonVariants({ variant: "default" }),
                     "rounded-2xl h-16 px-10 text-lg font-bold shadow-xl shadow-primary/20 gap-3 flex items-center justify-center transition-all",
                     isActive 
                      ? "bg-primary hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98]" 
                      : "bg-surface-warm text-text-muted cursor-not-allowed opacity-60 shadow-none border border-border-subtle"
                   )}
                 >
                   <Video size={24} /> {isActive ? 'Entra in Meet' : 'Chiamata non attiva'}
                 </a>
                 {!isActive && (
                   <p className="text-xs font-bold text-text-muted uppercase tracking-widest animate-pulse">
                     Il link si attiverà 5 min prima
                   </p>
                 )}
               </div>
             )}
             <Button 
               variant="outline" 
               onClick={downloadICS} 
               className="rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-16 px-10 text-lg font-bold gap-3 bg-white transition-all"
             >
               <Download size={24} /> Aggiungi al Calendario
             </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. COMPANY VIEW (NO SLOTS PROPOSED YET)
  if (role === "company" && initialSlots.length === 0) {
    return (
      <div className="p-8 md:p-12 md:pb-16 overflow-hidden relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                 Scheduling
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-display italic font-bold text-text-primary tracking-tight">
                  Pianifica la tua call conoscitiva
                </h3>
                <p className="text-text-secondary text-lg md:text-xl max-w-xl leading-relaxed">
                  Proponi fino a 3 slot orari. Il professionista sceglierà quello più adatto e il match verrà ufficializzato immediatamente.
                </p>
              </div>
            </div>
            {formStep === 0 && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={() => setFormStep(1)} 
                  className="rounded-[2rem] px-12 h-20 text-2xl font-display italic font-bold shadow-premium gap-4 group bg-primary hover:bg-primary-dark transition-all"
                >
                  <CalendarRange size={28} className="group-hover:rotate-12 transition-transform" />
                  Proponi Slot
                </Button>
              </motion.div>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {formStep > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-16 space-y-12"
              >
                {formStep === 1 && (
                  <div className="space-y-12">
                    <div className="flex items-center gap-4 border-b border-border-subtle pb-6">
                       <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg">1</span>
                       <h4 className="text-3xl font-display italic font-bold text-text-primary">Scegli le tue disponibilità</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {newSlots.map((s, idx) => (
                        <motion.div 
                          layout
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="group relative bg-white border border-border-subtle rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                        >
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-sans">
                                  {idx + 1}
                                </div>
                                <span className="text-xl font-display italic font-bold text-text-primary">Disponibilità</span>
                              </div>
                              
                              {newSlots.length > 1 && (
                                <button 
                                  onClick={() => setNewSlots(newSlots.filter((_, i) => i !== idx))}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Data</Label>
                                <DatePicker
                                  value={s.date}
                                  onChange={(date) => {
                                    const updated = [...newSlots];
                                    updated[idx].date = date;
                                    setNewSlots(updated);
                                  }}
                                  disablePast
                                  placeholder="gg/mm/aaaa"
                                  className="h-12 rounded-xl bg-white border-border-subtle text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Orario d&apos;inizio</Label>
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
                        </motion.div>
                      ))}

                      {newSlots.length < 3 && (
                        <motion.button 
                          layout
                          onClick={() => setNewSlots([...newSlots, { date: undefined, time: "09:00" }])}
                          className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-border-strong hover:border-primary/40 hover:bg-primary/2 transition-all flex flex-col items-center justify-center gap-3 group text-text-muted hover:text-primary bg-surface/30"
                        >
                          <Plus size={24} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                          <span className="font-display italic font-bold text-lg">Aggiungi slot</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-12 max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 border-b border-border-subtle pb-6">
                       <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg">2</span>
                       <h4 className="text-3xl font-display italic font-bold text-text-primary">Metodo della chiamata</h4>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                       <button 
                         onClick={() => setMeetingMethod("meet")}
                         className={cn(
                           "p-8 rounded-[2rem] text-left border-2 transition-all space-y-4 group",
                           meetingMethod === "meet" 
                             ? "border-primary bg-primary/3 shadow-premium" 
                             : "border-border-subtle bg-white hover:border-primary/40"
                         )}
                       >
                         <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                           meetingMethod === "meet" ? "bg-primary text-white" : "bg-surface-warm text-text-muted group-hover:bg-primary/10 group-hover:text-primary"
                         )}>
                           <Video size={24} />
                         </div>
                         <div className="space-y-1">
                           <p className="font-display italic font-bold text-xl text-text-primary">Genera Google Meet</p>
                           <p className="text-sm text-text-secondary leading-relaxed">Verrà creato automaticamente un link per ogni slot proposto.</p>
                         </div>
                       </button>

                       <button 
                         onClick={() => setMeetingMethod("custom")}
                         className={cn(
                           "p-8 rounded-[2rem] text-left border-2 transition-all space-y-4 group",
                           meetingMethod === "custom" 
                             ? "border-primary bg-primary/3 shadow-premium" 
                             : "border-border-subtle bg-white hover:border-primary/40"
                         )}
                       >
                         <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                           meetingMethod === "custom" ? "bg-primary text-white" : "bg-surface-warm text-text-muted group-hover:bg-primary/10 group-hover:text-primary"
                         )}>
                           <Calendar size={24} />
                         </div>
                         <div className="space-y-1">
                           <p className="font-display italic font-bold text-xl text-text-primary">Usa il tuo link</p>
                           <p className="text-sm text-text-secondary leading-relaxed">Inserisci il link della tua piattaforma (Zoom, Teams, Calendly, ecc).</p>
                         </div>
                       </button>
                    </div>

                    <AnimatePresence>
                      {meetingMethod === "custom" && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Link della chiamata</Label>
                          <input 
                            type="url"
                            placeholder="https://zoom.us/j/..."
                            value={customMeetingLink}
                            onChange={(e) => setCustomMeetingLink(e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl border-2 border-border-subtle focus:border-primary outline-none transition-all font-medium"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <motion.div 
                  layout
                  className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-12 border-t border-border-subtle/50"
                >
                  {formStep === 1 ? (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => setFormStep(0)} 
                        className="rounded-full h-16 px-10 font-bold text-text-secondary hover:text-text-primary text-lg"
                      >
                        Annulla
                      </Button>
                      <Button 
                        onClick={() => {
                          if (newSlots.some(s => !s.date)) {
                            toast.error("Assicurati di aver inserito tutte le date");
                            return;
                          }
                          setFormStep(2);
                        }} 
                        className="rounded-2xl px-16 h-16 text-xl font-bold shadow-xl shadow-primary/20 gap-4 group bg-primary hover:bg-primary-dark"
                      >
                        Continua
                        <Check size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => setFormStep(1)} 
                        className="rounded-full h-16 px-10 font-bold text-text-secondary hover:text-text-primary text-lg"
                      >
                        Indietro
                      </Button>
                      <Button 
                        onClick={handleProposeSlots} 
                        disabled={isPending} 
                        className="rounded-2xl px-16 h-16 text-xl font-bold shadow-xl shadow-primary/20 gap-4 group bg-primary hover:bg-primary-dark"
                      >
                        {isPending ? (
                          <Loader2 className="animate-spin" size={24} />
                        ) : (
                          <>
                            Invia Proposta
                            <Check size={24} strokeWidth={3} className="group-hover:scale-125 transition-transform" />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 3. WAITING STATE (FOR COMPANY)
  if (role === "company" && initialSlots.length > 0) {
    return (
      <div className="p-8 md:p-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative"
           >
              <div className="w-24 h-24 bg-white shadow-premium rounded-[2rem] flex items-center justify-center mx-auto text-primary border border-primary/10 relative z-10">
                <Clock size={40} strokeWidth={2.5} className="animate-[spin_4s_linear_infinite]" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse" />
           </motion.div>
           
           <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-display italic font-bold text-text-primary tracking-tight">
                Proposta inviata!
              </h3>
              <p className="text-text-secondary text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                Le tue disponibilità sono state inviate. Riceverai una notifica appena lo slot verrà confermato.
              </p>
           </div>

           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {initialSlots.map((s, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 bg-white border border-border-subtle rounded-[2.5rem] shadow-md flex flex-col items-center gap-2 group hover:bg-white hover:shadow-premium transition-all duration-300"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-2">
                    {new Date(s.startTime).toLocaleString('it-IT', { weekday: 'long' })}
                  </span>
                  <span className="text-2xl font-bold text-text-primary tracking-tight">
                    {new Date(s.startTime).toLocaleString('it-IT', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-2 text-primary font-display font-bold text-2xl italic mt-2">
                    <Clock size={18} />
                    {new Date(s.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </motion.div>
              ))}
           </div>

           <div className="pt-8">
              <Button 
                variant="ghost" 
                onClick={() => setFormStep(1)} 
                className="rounded-full font-bold text-text-muted hover:text-primary transition-all gap-2"
              >
                <Plus size={16} /> Modifica disponibilità
              </Button>
           </div>
        </div>
      </div>
    );
  }

  // 4. PROFESSIONAL VIEW (SELECT SLOT)
  if (role === "professional" && initialSlots.length > 0) {
    return (
      <div className="p-8 md:p-12 md:pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
               Conferma Colloquio
            </div>
            <h3 className="text-4xl md:text-5xl font-display italic font-bold text-text-primary tracking-tight">
              Scegli quando incontrarvi
            </h3>
            <p className="text-text-secondary text-lg md:text-xl max-w-xl leading-relaxed">
              L&apos;azienda ha proposto questi slot. Seleziona quello che preferisci per finalizzare il match.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {initialSlots.map((s, idx) => {
              const isSelected = selectedSlotId === s.id;
              return (
                <motion.button 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isPending}
                  onClick={() => s.id && setSelectedSlotId(s.id)}
                  className={`
                    p-10 rounded-[3rem] text-left transition-all relative overflow-hidden group
                    ${isSelected 
                      ? 'bg-primary text-white shadow-premium ring-8 ring-primary/10' 
                      : 'bg-white border border-border-subtle shadow-md hover:bg-white hover:shadow-premium text-text-primary'
                    }
                  `}
                >
                  <div className="flex flex-col gap-2 relative z-10">
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                      {new Date(s.startTime).toLocaleString('it-IT', { weekday: 'long' })}
                    </span>
                    <span className="text-3xl font-bold tracking-tighter">
                      {new Date(s.startTime).toLocaleString('it-IT', { day: 'numeric', month: 'long' })}
                    </span>
                    <div className="flex items-center gap-3 mt-6">
                      <Clock size={20} className={isSelected ? 'text-white/80' : 'text-primary'} />
                      <span className={`font-display italic font-bold text-3xl ${isSelected ? 'text-white' : 'text-primary'}`}>
                        {new Date(s.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className={`
                    absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isSelected ? 'bg-white text-primary scale-110 shadow-lg' : 'bg-white border border-border-subtle text-text-muted opacity-0 group-hover:opacity-100'}
                  `}>
                    <Check size={24} strokeWidth={3} />
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          <AnimatePresence>
            {selectedSlotId && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-16 flex flex-col items-center gap-6 pt-12 border-t border-border-subtle/50"
              >
                <div className="px-6 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold italic">
                   Hai scelto: {initialSlots.find(s => s.id === selectedSlotId) && 
                      new Date(initialSlots.find(s => s.id === selectedSlotId)!.startTime).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                   }
                </div>
                <Button 
                  onClick={handleConfirmSlot} 
                  disabled={isPending}
                  className="rounded-[2rem] h-20 px-16 text-2xl font-display italic font-bold shadow-premium gap-4 group transition-all hover:scale-105 active:scale-95"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={28} />
                      Conferma...
                    </>
                  ) : (
                    <>
                      Conferma Appuntamento
                      <Check size={28} strokeWidth={3} />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 5. NO SLOTS STATE (FOR PROFESSIONAL)
  if (role === "professional" && initialSlots.length === 0) {
    return (
      <div className="p-12 md:p-24 text-center">
        <div className="max-w-md mx-auto space-y-6">
           <div className="w-24 h-24 bg-surface-warm/50 border border-border-subtle rounded-[2rem] flex items-center justify-center mx-auto text-text-muted">
              <Calendar size={48} strokeWidth={1.5} />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-display italic font-bold text-text-primary">In attesa dell&apos;azienda</h3>
             <p className="text-text-secondary text-lg leading-relaxed">
               L&apos;azienda non ha ancora proposto degli slot. Riceverai una notifica non appena potrai scegliere l&apos;orario del colloquio.
             </p>
           </div>
        </div>
      </div>
    );
  }

  return null;

}
