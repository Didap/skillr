"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Check, Plus, Video, Download, Loader2, Trash2, CalendarRange, Sparkles, ChevronLeft, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { duration, ease, haptic, spring } from "@/lib/motion";
import { proposeSlots, confirmSlot } from "@/app/actions/booking";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { CALL_DURATION_MS } from "@/lib/calendar-utils";
import { romeDateTimeToDate, formatRomeDate, normalizeMeetingUrl } from "@/lib/rome-time";

// On phones each state is its own card under the profile; from md it sits inside the page's card.
const PHONE_CARD =
  "bg-white rounded-3xl border border-border-subtle shadow-card p-5 md:bg-transparent md:rounded-none md:border-0 md:shadow-none md:p-0";

// Buttons: compact sans on phones (thumb bar), the original display-italic look from md.
const PRIMARY_BTN =
  "pressable h-12 md:h-16 rounded-2xl px-6 md:px-12 text-base md:text-xl font-bold md:font-display md:italic gap-2 md:gap-3 bg-slate-950 text-white hover:bg-emerald-600 shadow-premium transition-colors";
const SECONDARY_BTN =
  "pressable h-12 md:h-14 rounded-2xl px-5 md:px-8 text-base font-bold gap-2 md:gap-3 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors";

const LABEL = "text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1";

const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: duration.state, ease: ease.out } },
  exit: { opacity: 0, x: -16, transition: { duration: duration.feedback, ease: ease.in } },
};

/**
 * Primary actions for the current step. Phones: pinned above the tab bar, thumb reach.
 * From md: back in the normal flow, wherever the parent places it.
 * The parent adds bottom padding on phones (pb-24, pb-36 when it may wrap to two rows)
 * so content never hides behind it. No transformed ancestor may wrap it, or `fixed`
 * would resolve against that ancestor instead of the viewport.
 */
function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex flex-wrap items-stretch gap-2 px-4 py-3",
        "bg-white/90 backdrop-blur-xl border-t border-slate-100 [&>*]:flex-auto",
        "md:static md:z-auto md:p-0 md:bg-transparent md:backdrop-blur-none md:border-0 md:flex-nowrap md:[&>*]:flex-none",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Calendar-leaf tile: day number over the short month, in Italian time. */
function DateTile({ date, active = false, className }: { date: Date; active?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center border transition-colors",
        active ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-100 text-slate-950",
        className
      )}
      aria-hidden="true"
    >
      <span className="text-xl font-bold leading-none tabular-nums">{formatRomeDate(date, { day: "numeric" })}</span>
      <span className={cn("mt-1 text-[11px] font-black uppercase tracking-wider leading-none", active ? "text-emerald-50" : "text-slate-500")}>
        {formatRomeDate(date, { month: "short" }).replace(".", "")}
      </span>
    </div>
  );
}

// The meeting button opens 5 minutes early and stays available for an hour, in case the call runs long.
const JOIN_OPENS_BEFORE_MS = 5 * 60_000;
const JOIN_AVAILABLE_FOR_MS = 60 * 60_000;

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
  targetName: string;
}

export function BookingSection({ 
  matchId, 
  role, 
  proposedSlots: initialSlots, 
  scheduledAt, 
  meetingLink,
  hasReviewed,
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
  const [isReproposing, setIsReproposing] = useState(false);
  const router = useRouter();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Slots are entered in Italian time, whatever the browser's timezone.
  const slotStart = (s: { date: Date | undefined; time: string }) =>
    s.date ? romeDateTimeToDate(s.date, s.time) : null;
  const isPastSlot = (s: { date: Date | undefined; time: string }, at: number) => {
    const start = slotStart(s);
    return !!start && start.getTime() <= at;
  };

  // Same checks as the server, so the company sees the problem before submitting.
  const validateNewSlots = (at: number) => {
    if (newSlots.some(s => !s.date)) return "Inserisci tutte le date";
    if (newSlots.some(s => isPastSlot(s, at))) return "Uno degli orari è già passato: scegline uno successivo";
    const starts = newSlots.map(s => slotStart(s)!.getTime());
    if (new Set(starts).size !== starts.length) return "Hai proposto due volte lo stesso orario";
    return null;
  };

  const handleProposeSlots = async () => {
    const slotsError = validateNewSlots(Date.now());
    if (slotsError) {
      toast.error(slotsError);
      setFormStep(1);
      return;
    }

    let linkToSubmit: string | undefined;
    if (meetingMethod === "custom") {
      const normalized = normalizeMeetingUrl(customMeetingLink);
      if (!normalized) {
        toast.error("Inserisci un link valido per la chiamata (es. https://zoom.us/j/...)");
        return;
      }
      linkToSubmit = normalized;
      setCustomMeetingLink(normalized);
    }

    setIsPending(true);
    try {
      const slotsToSubmit = newSlots.map(s => {
        const start = slotStart(s)!;
        return { startTime: start, endTime: new Date(start.getTime() + CALL_DURATION_MS) };
      });

      // On error the form keeps its state, so the company can switch to an external link.
      const res = await proposeSlots(matchId, slotsToSubmit, linkToSubmit);
      if (res.error) throw new Error(res.error);

      toast.success("Proposta inviata con successo!");
      setFormStep(0);
      setIsReproposing(false);
      setNewSlots([{ date: undefined, time: "09:00" }]);
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


  // 1. CONFIRMED STATE
  if (scheduledAt) {
    const startTime = new Date(scheduledAt);
    // Reviews unlock when the 30-minute call ends, same rule as saveReviewAction.
    const endTime = new Date(startTime.getTime() + CALL_DURATION_MS);
    const activationTime = new Date(startTime.getTime() - JOIN_OPENS_BEFORE_MS);
    const joinClosesAt = new Date(startTime.getTime() + JOIN_AVAILABLE_FOR_MS);
    const isActive = now >= activationTime && now < joinClosesAt;
    const isCompleted = now >= endTime;
    const showReview = isCompleted && !hasReviewed;
    // Calls that run over can still be rejoined until an hour after the start.
    const showRejoin = isCompleted && !!meetingLink && isActive;
    const hasActions = !isCompleted || showReview || showRejoin;

    return (
      <div className={cn("md:p-10", hasActions && "pb-36 md:pb-10")}>
        {/* Opacity-only entrance: a transform here would unpin the phone action bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: duration.view, ease: ease.out } }}
          className="bg-white rounded-3xl border border-border-subtle md:border-slate-100 shadow-card md:shadow-sm p-5 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 md:gap-10">
            <div className="flex-1 min-w-0 space-y-4">
              <div className={cn(
                "hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em]",
                isCompleted ? "bg-slate-100 text-slate-600" : "bg-emerald-500/10 text-emerald-700"
              )}>
                 {isCompleted ? <Check size={12} strokeWidth={3} /> : <Clock size={12} />}
                 {isCompleted ? 'Incontro Concluso' : 'Appuntamento Fissato'}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-4xl font-display italic text-slate-950 tracking-tight">
                  {isCompleted ? 'Com\'è andato l\'incontro?' : 'Ci vediamo presto!'}
                </h3>
                {isCompleted && (
                  <p className="text-[15px] md:text-lg text-slate-500 max-w-xl leading-relaxed">
                    {`L'incontro con ${targetName} si è concluso. Lascia un feedback per completare il match.`}
                  </p>
                )}
              </div>

              {/* When: the one thing to remember */}
              <div className="flex items-center gap-4 p-3 md:p-4 rounded-2xl bg-slate-50/70 border border-slate-100 max-w-md">
                <DateTile date={startTime} active={!isCompleted} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">
                    {isCompleted ? "Incontro concluso" : "Il tuo incontro è programmato per"}
                  </p>
                  <p className="font-bold text-slate-950 first-letter:uppercase truncate">
                    {formatRomeDate(startTime, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm font-semibold text-slate-600 tabular-nums">
                    {formatRomeDate(startTime, { hour: '2-digit', minute: '2-digit' })}–{formatRomeDate(endTime, { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-slate-400 font-medium"> · ora italiana</span>
                  </p>
                </div>
              </div>
            </div>

            {hasActions && (
              <ActionBar className="md:flex-col md:gap-3 md:w-auto md:[&>*]:w-full">
                {isCompleted ? (
                  <>
                    {showReview && (
                      <Button onClick={() => setIsReviewOpen(true)} className={cn(PRIMARY_BTN, "md:px-10")}>
                        <Sparkles size={20} className="text-amber-400" />
                        Lascia Feedback
                      </Button>
                    )}
                    {showRejoin && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline" }), SECONDARY_BTN)}
                      >
                        <Video size={20} /> Rientra nella call
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    {meetingLink && (
                      <a
                        href={isActive ? meetingLink : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!isActive}
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "h-12 md:h-14 rounded-2xl px-5 md:px-8 text-base font-bold gap-2 md:gap-3 transition-colors",
                          isActive
                            ? "pressable bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-slate-100 text-slate-500 cursor-not-allowed"
                        )}
                      >
                        <Video size={20} /> {isActive ? 'Entra in Meet' : 'Link non ancora attivo'}
                      </a>
                    )}
                    <Button variant="outline" onClick={downloadICS} className={SECONDARY_BTN}>
                      <Download size={20} /> Calendario
                    </Button>
                  </>
                )}
              </ActionBar>
            )}
          </div>
        </motion.div>

        <ReviewDialog
          isOpen={isReviewOpen}
          onClose={() => {
              setIsReviewOpen(false);
              router.refresh();
          }}
          matchId={matchId}
          targetName={targetName}
        />
      </div>
    );
  }

  // 2. COMPANY VIEW (PROPOSE SLOTS)
  if (role === "company" && (initialSlots.length === 0 || isReproposing)) {
    return (
      <div className="pb-24 md:p-10">
        <div className={cn(PHONE_CARD, "max-w-5xl mx-auto")}>
          {formStep === 0 ? (
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-5 md:gap-10">
              <div className="flex-1 space-y-4">
                <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-black uppercase tracking-[0.2em]">
                   Scheduling
                </div>
                <div className="space-y-2 md:space-y-3">
                  <h3 className="text-2xl md:text-4xl font-display italic text-slate-950 tracking-tight">
                    Pianifica la tua call conoscitiva
                  </h3>
                  <p className="text-[15px] md:text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
                    Proponi fino a 3 slot orari. Il match verrà ufficializzato appena lo slot verrà confermato.
                  </p>
                </div>
              </div>
              <ActionBar>
                <Button onClick={() => setFormStep(1)} className={PRIMARY_BTN}>
                  <CalendarRange size={20} />
                  Proponi Slot
                </Button>
              </ActionBar>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-8">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 md:pb-6">
                 <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <button
                      type="button"
                      aria-label={formStep === 2 ? "Indietro" : "Annulla"}
                      onClick={() => {
                        if (formStep === 1 && isReproposing) {
                          setIsReproposing(false);
                          setFormStep(0);
                          return;
                        }
                        setFormStep(formStep - 1);
                      }}
                      className="pressable w-11 h-11 shrink-0 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                    >
                      {formStep === 2 ? <ChevronLeft size={20} /> : <X size={18} />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-lg md:text-xl font-display italic text-slate-950 truncate">
                        {formStep === 1 ? "Selezione Disponibilità" : "Metodo Incontro"}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Step {formStep} di 2</p>
                    </div>
                 </div>
                 <div className="flex gap-1.5 shrink-0" aria-hidden="true">
                    {[1, 2].map(s => (
                      <div key={s} className={cn("w-6 md:w-8 h-1.5 rounded-full transition-colors duration-300", formStep >= s ? "bg-emerald-500" : "bg-slate-100")} />
                    ))}
                 </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {formStep === 1 && (
                  <motion.div key="step1" {...stepMotion} className="space-y-3 md:space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                      {newSlots.map((s, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-4 md:p-6 md:shadow-sm hover:border-emerald-100 transition-colors">
                          <div className="space-y-4 md:space-y-6">
                            <div className="flex justify-between items-center min-h-11">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">{idx + 1}</div>
                                <span className="text-lg font-display italic text-slate-950">Disponibilità</span>
                              </div>
                              {newSlots.length > 1 && (
                                <button
                                  type="button"
                                  aria-label={`Rimuovi disponibilità ${idx + 1}`}
                                  onClick={() => setNewSlots(newSlots.filter((_, i) => i !== idx))}
                                  className="pressable w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className={LABEL}>Data</Label>
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
                                <Label className={LABEL}>Orario (ora italiana)</Label>
                                <TimePicker
                                  value={s.time}
                                  onChange={(time) => {
                                    const updated = [...newSlots];
                                    updated[idx].time = time;
                                    setNewSlots(updated);
                                  }}
                                />
                                {/* disablePast only blocks past days: today's earlier hours are caught here. */}
                                {isPastSlot(s, now.getTime()) && (
                                  <p role="alert" className="text-xs font-bold text-rose-600 pl-1">
                                    Orario già passato: scegline uno successivo.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {newSlots.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setNewSlots([...newSlots, { date: undefined, time: "09:00" }])}
                          className="pressable w-full h-12 md:h-full md:min-h-[200px] rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200 md:border-slate-100 bg-white md:bg-slate-50/50 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors flex md:flex-col items-center justify-center gap-2 md:gap-3 group text-slate-700 md:text-slate-500 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 md:w-12 md:h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm md:group-hover:scale-110 transition-transform">
                             <Plus size={18} className="md:hidden" />
                             <Plus size={24} className="hidden md:block" />
                          </span>
                          <span className="font-bold text-base md:font-display md:italic md:text-lg">Aggiungi slot</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {formStep === 2 && (
                  <motion.div key="step2" {...stepMotion} className="space-y-4 md:space-y-10 max-w-3xl mx-auto">
                    <div role="radiogroup" aria-label="Metodo incontro" className="grid sm:grid-cols-2 gap-3 md:gap-6">
                      {([
                        { value: "meet", Icon: Video, title: "Google Meet", desc: "Link generato alla conferma dello slot." },
                        { value: "custom", Icon: Calendar, title: "Link Esterno", desc: "Zoom, Teams o altro." },
                      ] as const).map(({ value, Icon, title, desc }) => {
                        const selected = meetingMethod === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setMeetingMethod(value)}
                            className={cn(
                              "pressable relative w-full flex sm:flex-col items-center sm:items-start gap-4 p-4 pr-12 sm:pr-8 md:p-8 rounded-3xl md:rounded-[2.5rem] text-left border-2 transition-colors group",
                              selected ? "border-emerald-500 bg-emerald-50/50 md:shadow-premium" : "border-slate-100 bg-white hover:border-emerald-200"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-colors",
                              selected ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-50 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                            )}>
                              <Icon size={24} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-display italic text-lg md:text-xl text-slate-950">{title}</p>
                              <p className="text-sm md:text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
                            </div>
                            <AnimatePresence initial={false}>
                              {selected && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1, transition: spring.snappy }}
                                  exit={{ scale: 0, opacity: 0, transition: { duration: duration.feedback } }}
                                  className="absolute top-1/2 -mt-2.5 right-4 sm:top-6 sm:mt-0 sm:right-6 text-emerald-600"
                                >
                                  <Check size={20} strokeWidth={3} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence initial={false}>
                      {meetingMethod === "custom" && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                          exit={{ opacity: 0, y: 8, transition: { duration: duration.feedback, ease: ease.in } }}
                          className="space-y-2"
                        >
                          <Label htmlFor={`meeting-link-${matchId}`} className={LABEL}>URL Chiamata</Label>
                          <input
                            id={`meeting-link-${matchId}`}
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="https://zoom.us/j/..."
                            value={customMeetingLink}
                            onChange={(e) => setCustomMeetingLink(e.target.value)}
                            className="w-full h-14 px-4 md:px-6 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition-colors font-bold text-base text-slate-950"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Kept outside the animated step: a transformed ancestor would unpin it on phones */}
              <ActionBar className="md:justify-center md:pt-4">
                {formStep === 1 ? (
                  <Button
                    onClick={() => { const slotsError = validateNewSlots(Date.now()); if (slotsError) { toast.error(slotsError); return; } setFormStep(2); }}
                    className={cn(PRIMARY_BTN, "md:px-16")}
                  >
                    Continua
                  </Button>
                ) : (
                  <Button onClick={handleProposeSlots} disabled={isPending} className={cn(PRIMARY_BTN, "md:px-20")}>
                    {isPending ? <Loader2 className="animate-spin" /> : "Invia Proposta"}
                  </Button>
                )}
              </ActionBar>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. WAITING STATE (FOR COMPANY)
  if (role === "company" && initialSlots.length > 0) {
    const allExpired = initialSlots.every(slot => new Date(slot.startTime) <= now);

    return (
      <div className="pb-24 md:p-16">
        <div className={cn(PHONE_CARD, "max-w-4xl mx-auto md:text-center space-y-5 md:space-y-12")}>
           <div className="space-y-2 md:space-y-4">
              <div className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                 <Check size={12} strokeWidth={3} /> Proposta Inviata
              </div>
              <h3 className="text-2xl md:text-4xl font-display italic text-slate-950 tracking-tight">
                {allExpired ? "Gli orari proposti sono passati" : "Proposta inviata!"}
              </h3>
              <p className="text-[15px] md:text-lg text-slate-500 max-w-lg md:mx-auto leading-relaxed font-medium">
                {allExpired
                  ? "Nessuno slot è stato confermato in tempo. Proponi nuovi orari per fissare la call."
                  : "Le tue disponibilità sono state inviate. Riceverai una notifica appena lo slot verrà confermato."}
              </p>
           </div>

           <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 md:gap-6 max-w-3xl mx-auto">
             {initialSlots.map((slot, idx) => {
               const isExpired = new Date(slot.startTime) <= now;
               return (
                 <li
                   key={idx}
                   className={cn(
                     "flex items-center justify-between gap-3 md:block bg-white border border-slate-100 p-4 md:p-6 rounded-2xl md:rounded-3xl md:shadow-sm text-left",
                     isExpired && "opacity-50"
                   )}
                 >
                   <div className="min-w-0">
                     <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 md:mb-2">
                       Opzione {idx + 1}{isExpired && " · Scaduto"}
                     </p>
                     <p className="text-base md:text-lg font-bold text-slate-950">{formatRomeDate(slot.startTime, { day: 'numeric', month: 'short' })}</p>
                   </div>
                   <p className="text-base md:text-sm font-bold md:font-medium text-slate-600 md:text-slate-500 tabular-nums">{formatRomeDate(slot.startTime, { hour: '2-digit', minute: '2-digit' })}</p>
                 </li>
               );
             })}
           </ul>

           <ActionBar className="md:justify-center">
             <Button
               variant={allExpired ? "default" : "outline"}
               onClick={() => {
                 if (meetingLink) {
                   setMeetingMethod("custom");
                   setCustomMeetingLink(meetingLink);
                 }
                 setIsReproposing(true);
                 setFormStep(1);
               }}
               className={cn(
                 "pressable h-12 md:h-14 rounded-2xl px-6 md:px-8 text-base font-bold gap-2 md:gap-3 transition-colors",
                 allExpired ? "bg-slate-950 text-white hover:bg-emerald-600" : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
               )}
             >
               <CalendarRange size={20} /> {allExpired ? "Proponi nuovi orari" : "Modifica proposta"}
             </Button>
           </ActionBar>

           {meetingLink && (
             <motion.div
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
               className="max-w-md mx-auto p-4 md:p-6 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 space-y-3"
             >
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Dettagli Incontro</p>
               <div className="flex items-center md:justify-center gap-3">
                 <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600">
                    <Video size={20} />
                 </div>
                 <div className="text-left min-w-0">
                    <p className="font-bold text-slate-950">Link della call</p>
                    <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm md:text-xs text-emerald-700 hover:underline font-medium break-all">
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
    const allExpired = initialSlots.every(slot => new Date(slot.startTime) <= now);

    return (
      <div className="pb-24 md:p-16">
        <div className={cn(PHONE_CARD, "max-w-5xl mx-auto space-y-5 md:space-y-16")}>
          <div className="md:text-center space-y-2 md:space-y-4">
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-black uppercase tracking-[0.2em]">
               Scheduling
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl md:text-5xl font-display italic text-slate-950 tracking-tight">
                Quando sei disponibile?
              </h3>
              <p className="text-[15px] md:text-xl text-slate-500 max-w-2xl md:mx-auto leading-relaxed font-medium">
                {allExpired
                  ? "Gli orari proposti sono passati: l'azienda dovrà proporne di nuovi."
                  : `L'azienda ha proposto questi slot ${meetingLink ? "con un link alla call" : "per un incontro su Google Meet"}. Seleziona quello che preferisci per confermare.`}
              </p>
            </div>
          </div>

          <div role="radiogroup" aria-label="Orari proposti" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {initialSlots.map((slot) => {
              const isExpired = new Date(slot.startTime) <= now;
              const selected = selectedSlotId === slot.id;
              const start = new Date(slot.startTime);
              return (
              <motion.button
                key={slot.id}
                type="button"
                role="radio"
                aria-checked={selected}
                whileTap={isExpired ? undefined : { scale: 0.98 }}
                disabled={isExpired}
                onClick={() => {
                  setSelectedSlotId(slot.id || null);
                  haptic();
                }}
                className={cn(
                  "relative w-full min-h-16 flex items-center gap-4 p-3 pr-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 text-left outline-none",
                  "transition-[border-color,background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                  isExpired
                    ? "border-slate-100 bg-white opacity-50 cursor-not-allowed"
                    : selected
                      ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/15 md:shadow-premium"
                      : "border-slate-100 bg-white hover:border-emerald-200"
                )}
              >
                <DateTile date={start} active={selected} className="md:w-16 md:h-16" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 truncate">
                    {formatRomeDate(start, { weekday: 'long' })}{isExpired && " · Scaduto"}
                  </p>
                  <p className="text-lg md:text-2xl font-display italic text-slate-950 truncate">
                    {formatRomeDate(start, { day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-base md:text-lg font-bold text-slate-600 tabular-nums">
                    {formatRomeDate(start, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-white transition-colors duration-200",
                    selected ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200"
                  )}
                >
                  <AnimatePresence initial={false}>
                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, transition: spring.snappy }}
                        exit={{ scale: 0, transition: { duration: duration.feedback } }}
                        className="flex"
                      >
                        <Check size={16} strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.button>
              );
            })}
          </div>

          <ActionBar className="md:justify-center">
            <Button
              onClick={handleConfirmSlot}
              disabled={!selectedSlotId || isPending || initialSlots.some(s => s.id === selectedSlotId && new Date(s.startTime) <= now)}
              className={cn(PRIMARY_BTN, "md:h-20 md:rounded-[2rem] md:px-20 md:text-2xl")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : (
                <>
                  <Check size={22} strokeWidth={2.5} />
                  Conferma Incontro
                </>
              )}
            </Button>
          </ActionBar>
        </div>
      </div>
    );
  }

  // 5. NO SLOTS STATE (FOR PROFESSIONAL)
  if (role === "professional" && initialSlots.length === 0) {
    return (
      <div className="md:p-24">
        <div className={cn(PHONE_CARD, "py-8 text-center")}>
          <div className="max-w-md mx-auto space-y-4 md:space-y-6">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 border border-slate-100 rounded-3xl md:rounded-[2rem] flex items-center justify-center mx-auto text-slate-500">
                <Calendar size={28} strokeWidth={1.5} />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-display italic text-slate-950">In attesa dell&apos;azienda</h3>
               <p className="text-[15px] md:text-lg text-slate-500 leading-relaxed font-medium">L&apos;azienda non ha ancora proposto degli slot. Riceverai una notifica appena potrai scegliere l&apos;orario.</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
