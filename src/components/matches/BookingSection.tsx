"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Check, Plus, Video, Download, Loader2, Trash2, CalendarRange, Sparkles, ChevronLeft, X, Globe, type LucideIcon } from "lucide-react";
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
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { CALL_DURATION_MINUTES, CALL_DURATION_MS, generateIcsString, joinState } from "@/lib/calendar-utils";
import { romeDateTimeToDate, formatRomeDate, normalizeMeetingUrl } from "@/lib/rome-time";

// On phones each state is its own card under the profile; from md it sits inside the page's card.
const PHONE_CARD =
  "bg-white rounded-card ring-1 ring-viola/15 p-6 md:bg-transparent md:rounded-none md:ring-0 md:p-0";

// Rosso pill (Button default) and white pill with a viola outline (Button outline)
const PRIMARY_BTN = "h-12 md:h-14 px-6 md:px-10 text-base md:text-lg gap-2";
const SECONDARY_BTN = "h-12 md:h-14 px-5 md:px-8 text-base gap-2";

const LABEL = "text-label text-viola pl-4";

// Small status pill above the headings, from md up
const STATUS_PILL = "hidden md:inline-flex items-center gap-2 h-8 px-4 rounded-full text-chip";

// Every action bar here sits inside a phone card, where BottomActionBar's own spacer would
// show up as blank card space: each state's wrapper reserves the room on phones instead
// (pb-24, pb-36 where the bar can wrap to two rows).
const NO_SPACER = "hidden";

const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: duration.state, ease: ease.out } },
  exit: { opacity: 0, x: -16, transition: { duration: duration.feedback, ease: ease.in } },
};

/** Round calendar leaf: day number over the short month, in Italian time. */
function DateTile({ date, className }: { date: Date; className?: string }) {
  return (
    <div
      className={cn(
        "w-12 h-12 shrink-0 rounded-full bg-white text-viola flex flex-col items-center justify-center",
        className
      )}
      aria-hidden="true"
    >
      <span className="text-lg font-bold leading-none tabular-nums">{formatRomeDate(date, { day: "numeric" })}</span>
      <span className="mt-0.5 text-[11px] font-semibold leading-none text-viola-500">
        {formatRomeDate(date, { month: "short" }).replace(".", "")}
      </span>
    </div>
  );
}

/** Profile-style info row: line icon, small label over a medium value. */
function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon size={24} strokeWidth={1.75} className="shrink-0 mt-1 text-viola" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-label text-viola">{label}</dt>
        <dd className="text-body font-medium text-viola">{children}</dd>
      </div>
    </div>
  );
}

interface SlotDraft {
  date: Date | undefined;
  time: string;
}

// Drafts are replaced, never mutated, so this one object can seed every new row.
const EMPTY_SLOT: SlotDraft = { date: undefined, time: "09:00" };

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
  const [newSlots, setNewSlots] = useState<SlotDraft[]>([EMPTY_SLOT]);
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
  const slotStart = (s: SlotDraft) =>
    s.date ? romeDateTimeToDate(s.date, s.time) : null;
  const isPastSlot = (s: SlotDraft, at: number) => {
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

  const updateSlot = (idx: number, patch: Partial<SlotDraft>) =>
    setNewSlots(newSlots.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

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
      setNewSlots([EMPTY_SLOT]);
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

  // 1. CONFIRMED STATE
  if (scheduledAt) {
    const startTime = new Date(scheduledAt);
    // Reviews unlock when the 30-minute call ends, same rule as saveReviewAction.
    const endTime = new Date(startTime.getTime() + CALL_DURATION_MS);
    const isActive = joinState(startTime, endTime, now.getTime()) === "open";
    const isCompleted = now >= endTime;

    // Same UID as the emailed invite, so calendars treat both as one event.
    const downloadICS = () => {
      const icsContent = generateIcsString({
        title: "Colloquio Helllo",
        description: `Link Meet: ${meetingLink || 'N/A'}`,
        startTime,
        endTime,
        location: meetingLink || 'Google Meet',
        uid: matchId,
      });
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "colloquio_helllo.ics");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
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
          className="bg-white rounded-card ring-1 ring-viola/15 p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 md:gap-10">
            <div className="flex-1 min-w-0 space-y-4">
              <div className={cn(
                STATUS_PILL,
                isCompleted ? "border border-viola/30 text-viola-500" : "bg-rosso text-white font-bold"
              )}>
                 {isCompleted ? <Check size={14} strokeWidth={2.5} /> : <span className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />}
                 {isCompleted ? 'Incontro concluso' : 'Colloquio fissato'}
              </div>
              <div className="space-y-2">
                <h3 className="text-title md:text-display font-display text-viola">
                  {isCompleted ? 'Com\'è andato l\'incontro?' : 'Ci vediamo presto!'}
                </h3>
                {isCompleted && (
                  <p className="text-body md:text-lg text-viola-500 max-w-xl">
                    {`L'incontro con ${targetName} si è concluso. Lascia un feedback per completare il match.`}
                  </p>
                )}
              </div>

              {/* When: the one thing to remember */}
              <dl className="max-w-md divide-y divide-viola/15">
                <InfoRow icon={Calendar} label={isCompleted ? "Incontro concluso" : "Quando"}>
                  <span className="block first-letter:uppercase truncate">
                    {formatRomeDate(startTime, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </InfoRow>
                <InfoRow icon={Clock} label="Orario (ora italiana)">
                  <span className="tabular-nums">
                    {formatRomeDate(startTime, { hour: '2-digit', minute: '2-digit' })}–{formatRomeDate(endTime, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </InfoRow>
              </dl>
            </div>

            {hasActions && (
              <BottomActionBar desktop="static" spacerClassName={NO_SPACER} className="md:flex-col md:gap-3 md:w-auto md:[&>*]:w-full">
                {isCompleted ? (
                  <>
                    {showReview && (
                      <Button onClick={() => setIsReviewOpen(true)} className={PRIMARY_BTN}>
                        <Sparkles size={20} />
                        Lascia un feedback
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
                          "h-12 md:h-14 px-5 md:px-8 text-base gap-2",
                          !isActive && "bg-crema text-viola-500 hover:bg-crema cursor-not-allowed"
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
              </BottomActionBar>
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

  const isExpired = (slot: Slot) => new Date(slot.startTime) <= now;
  const allExpired = initialSlots.every(isExpired);

  // 2. COMPANY VIEW (PROPOSE SLOTS)
  if (role === "company" && (initialSlots.length === 0 || isReproposing)) {
    return (
      <div className="pb-24 md:p-10">
        <div className={cn(PHONE_CARD, "max-w-5xl mx-auto")}>
          {formStep === 0 ? (
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-5 md:gap-10">
              <div className="flex-1 space-y-4">
                <div className={cn(STATUS_PILL, "bg-rosa text-viola")}>
                   È un helllo!
                </div>
                <div className="space-y-2 md:space-y-3">
                  <h3 className="text-title md:text-display font-display text-viola">
                    Pianifica la tua call conoscitiva
                  </h3>
                  <p className="text-body md:text-lg text-viola-500 max-w-xl">
                    Proponi fino a 3 orari. Il colloquio è fissato appena {targetName} ne conferma uno.
                  </p>
                </div>
              </div>
              <BottomActionBar desktop="static" spacerClassName={NO_SPACER}>
                <Button onClick={() => setFormStep(1)} className={PRIMARY_BTN}>
                  <Calendar size={20} />
                  Fissa un colloquio
                </Button>
              </BottomActionBar>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-8">
              <div className="flex items-center justify-between gap-3 border-b border-viola/15 pb-4 md:pb-6">
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
                      className="pressable w-11 h-11 shrink-0 rounded-full flex items-center justify-center border border-viola bg-white text-viola hover:bg-crema transition-colors"
                    >
                      {formStep === 2 ? <ChevronLeft size={20} /> : <X size={18} />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-lg md:text-2xl font-display font-bold text-viola truncate">
                        {formStep === 1 ? "Scegli gli orari" : "Scegli dove vedervi"}
                      </h4>
                      <p className="text-label text-viola-500">Passo {formStep} di 2</p>
                    </div>
                 </div>
                 <div className="flex gap-1.5 shrink-0" aria-hidden="true">
                    {[1, 2].map(s => (
                      <div key={s} className={cn("w-6 md:w-8 h-1.5 rounded-full transition-colors duration-300", formStep >= s ? "bg-rosso" : "bg-crema")} />
                    ))}
                 </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {formStep === 1 && (
                  <motion.div key="step1" {...stepMotion} className="space-y-3 md:space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                      {newSlots.map((s, idx) => (
                        <div key={idx} className="bg-white ring-1 ring-viola/15 rounded-card p-5 md:p-6">
                          <div className="space-y-4 md:space-y-5">
                            <div className="flex justify-between items-center min-h-11">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-rosa text-viola flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                                <span className="text-lg font-display font-bold text-viola">Disponibilità</span>
                              </div>
                              {newSlots.length > 1 && (
                                <button
                                  type="button"
                                  aria-label={`Rimuovi disponibilità ${idx + 1}`}
                                  onClick={() => setNewSlots(newSlots.filter((_, i) => i !== idx))}
                                  className="pressable w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-viola-500 hover:text-rosso-700 hover:bg-rosso-50 transition-colors"
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
                                  onChange={(date) => updateSlot(idx, { date })}
                                  disablePast
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={LABEL}>Orario (ora italiana)</Label>
                                <TimePicker
                                  value={s.time}
                                  onChange={(time) => updateSlot(idx, { time })}
                                />
                                {/* disablePast only blocks past days: today's earlier hours are caught here. */}
                                {isPastSlot(s, now.getTime()) && (
                                  <p role="alert" className="text-label font-bold text-destructive pl-4">
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
                          onClick={() => setNewSlots([...newSlots, EMPTY_SLOT])}
                          className="pressable w-full h-12 md:h-full md:min-h-[200px] rounded-full md:rounded-card bg-crema hover:bg-rosa transition-colors flex md:flex-col items-center justify-center gap-2 md:gap-3 text-viola"
                        >
                          <span className="w-7 h-7 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center">
                             <Plus className="size-[18px] md:size-6" />
                          </span>
                          <span className="font-bold text-base md:text-lg">Aggiungi un orario</span>
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
                        { value: "custom", Icon: Globe, title: "Link esterno", desc: "Zoom, Teams o altro." },
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
                              "pressable relative w-full flex sm:flex-col items-center sm:items-start gap-4 p-5 pr-12 sm:pr-8 md:p-7 rounded-card text-left border-2 transition-colors group",
                              selected ? "border-rosso bg-rosso-50" : "border-viola/15 bg-white hover:border-viola/40"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-colors",
                              selected ? "bg-rosso text-white" : "bg-crema text-viola group-hover:bg-rosa"
                            )}>
                              <Icon size={24} strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-display font-bold text-lg md:text-xl text-viola">{title}</p>
                              <p className="text-label text-viola-500">{desc}</p>
                            </div>
                            <AnimatePresence initial={false}>
                              {selected && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1, transition: spring.snappy }}
                                  exit={{ scale: 0, opacity: 0, transition: { duration: duration.feedback } }}
                                  className="absolute top-1/2 -mt-2.5 right-4 sm:top-6 sm:mt-0 sm:right-6 text-rosso-600"
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
                          <Label htmlFor={`meeting-link-${matchId}`} className={LABEL}>Link della chiamata</Label>
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
                            className="w-full h-14 px-6 rounded-full bg-crema outline-none focus-visible:ring-3 focus-visible:ring-ring/50 transition-shadow font-medium text-base text-viola placeholder:text-viola-400"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Kept outside the animated step: a transformed ancestor would unpin it on phones */}
              <BottomActionBar desktop="static" spacerClassName={NO_SPACER} className="md:justify-center md:pt-4">
                {formStep === 1 ? (
                  <Button
                    onClick={() => { const slotsError = validateNewSlots(Date.now()); if (slotsError) { toast.error(slotsError); return; } setFormStep(2); }}
                    className={cn(PRIMARY_BTN, "md:px-16")}
                  >
                    Continua
                  </Button>
                ) : (
                  <Button onClick={handleProposeSlots} disabled={isPending} className={cn(PRIMARY_BTN, "md:px-16")}>
                    {isPending ? <Loader2 className="animate-spin" /> : "Invia proposta"}
                  </Button>
                )}
              </BottomActionBar>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. WAITING STATE (FOR COMPANY, SLOTS PROPOSED)
  if (role === "company") {
    return (
      <div className="pb-24 md:p-16">
        <div className={cn(PHONE_CARD, "max-w-4xl mx-auto md:text-center space-y-5 md:space-y-12")}>
           <div className="space-y-2 md:space-y-4">
              <div className={cn(STATUS_PILL, "mb-4", allExpired ? "border border-viola/30 text-viola-500" : "bg-rosa text-viola")}>
                 <Check size={14} strokeWidth={2.5} /> Proposta inviata
              </div>
              <h3 className="text-title md:text-display font-display text-viola">
                {allExpired ? "Gli orari proposti sono passati" : "Proposta inviata!"}
              </h3>
              <p className="text-body md:text-lg text-viola-500 max-w-lg md:mx-auto">
                {allExpired
                  ? "Nessuno slot è stato confermato in tempo. Proponi nuovi orari per fissare la call."
                  : "Le tue disponibilità sono state inviate. Riceverai una notifica appena lo slot verrà confermato."}
              </p>
           </div>

           <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 md:gap-3 max-w-3xl mx-auto">
             {initialSlots.map((slot, idx) => {
               const expired = isExpired(slot);
               return (
                 <li
                   key={idx}
                   className={cn(
                     "flex items-center justify-between gap-3 bg-crema text-viola pl-6 pr-5 py-3 rounded-full text-left",
                     expired && "opacity-50"
                   )}
                 >
                   <div className="min-w-0">
                     <p className="text-label text-viola-500">
                       Opzione {idx + 1}{expired && " · Scaduto"}
                     </p>
                     <p className="text-base font-bold">{formatRomeDate(slot.startTime, { day: 'numeric', month: 'short' })}</p>
                   </div>
                   <p className="text-base font-bold tabular-nums">{formatRomeDate(slot.startTime, { hour: '2-digit', minute: '2-digit' })}</p>
                 </li>
               );
             })}
           </ul>

           <BottomActionBar desktop="static" spacerClassName={NO_SPACER} className="md:justify-center">
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
               className={SECONDARY_BTN}
             >
               <CalendarRange size={20} /> {allExpired ? "Proponi nuovi orari" : "Modifica proposta"}
             </Button>
           </BottomActionBar>

           {meetingLink && (
             <motion.div
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
               className="max-w-md mx-auto p-5 md:p-6 rounded-card bg-crema space-y-3"
             >
               <p className="text-label text-viola-500 md:text-center">Dettagli dell&apos;incontro</p>
               <div className="flex items-center md:justify-center gap-3">
                 <div className="w-11 h-11 shrink-0 rounded-full bg-white flex items-center justify-center text-viola">
                    <Video size={20} strokeWidth={1.75} />
                 </div>
                 <div className="text-left min-w-0">
                    <p className="font-bold text-viola">Link della call</p>
                    <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blu underline decoration-blu/40 underline-offset-2 hover:decoration-blu font-medium break-all">
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
  if (initialSlots.length > 0) {
    return (
      <div className="pb-24 md:p-16">
        <div className={cn(PHONE_CARD, "max-w-5xl mx-auto space-y-5 md:space-y-16")}>
          <div className="md:text-center space-y-2 md:space-y-4">
            <div className={cn(STATUS_PILL, "bg-rosa text-viola")}>
               È un helllo!
            </div>
            <div className="space-y-2">
              <h3 className="text-title md:text-display font-display text-viola">
                Quando sei disponibile?
              </h3>
              <p className="text-body md:text-lg text-viola-500 max-w-2xl md:mx-auto">
                {allExpired
                  ? "Gli orari proposti sono passati: l'azienda dovrà proporne di nuovi."
                  : `L'azienda ha proposto questi slot ${meetingLink ? "con un link alla call" : "per un incontro su Google Meet"}. Seleziona quello che preferisci per confermare.`}
              </p>
            </div>
          </div>

          <div role="radiogroup" aria-label="Orari proposti" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {initialSlots.map((slot) => {
              const expired = isExpired(slot);
              const selected = selectedSlotId === slot.id;
              const start = new Date(slot.startTime);
              return (
              <motion.button
                key={slot.id}
                type="button"
                role="radio"
                aria-checked={selected}
                whileTap={expired ? undefined : { scale: 0.98 }}
                disabled={expired}
                onClick={() => {
                  setSelectedSlotId(slot.id || null);
                  haptic();
                }}
                className={cn(
                  "relative w-full min-h-16 flex items-center gap-3 py-2.5 pl-2.5 pr-4 rounded-full text-left outline-none",
                  "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  expired
                    ? "bg-crema text-viola opacity-50 cursor-not-allowed"
                    : selected
                      ? "bg-rosso text-white"
                      : "bg-crema text-viola hover:bg-rosa"
                )}
              >
                <DateTile date={start} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-label truncate first-letter:uppercase", selected ? "font-bold" : "text-viola-500")}>
                    {formatRomeDate(start, { weekday: 'long' })}{expired && " · Scaduto"}
                  </p>
                  <p className="text-body font-bold truncate">
                    {formatRomeDate(start, { day: 'numeric', month: 'long' })}
                    <span className="tabular-nums"> · {formatRomeDate(start, { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-colors duration-200",
                    selected ? "bg-white text-rosso-600" : "bg-white ring-1 ring-viola/30"
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

          {/* What to know before confirming, like the profile's info card */}
          <dl className="max-w-md md:mx-auto rounded-card ring-1 ring-viola/15 px-5 py-1 divide-y divide-viola/15">
            <InfoRow icon={Clock} label="Durata">{CALL_DURATION_MINUTES} minuti, ora italiana</InfoRow>
            <InfoRow icon={Video} label="Dove">{meetingLink ? "Link alla call dell'azienda" : "Google Meet"}</InfoRow>
          </dl>

          <BottomActionBar desktop="static" spacerClassName={NO_SPACER} className="md:justify-center">
            <Button
              onClick={handleConfirmSlot}
              disabled={!selectedSlotId || isPending || initialSlots.some(s => s.id === selectedSlotId && isExpired(s))}
              className={cn(PRIMARY_BTN, "md:h-16 md:px-16")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : (
                <>
                  <Calendar size={22} />
                  Fissa il colloquio
                </>
              )}
            </Button>
          </BottomActionBar>
        </div>
      </div>
    );
  }

  // 5. NO SLOTS STATE (FOR PROFESSIONAL)
  return (
    <div className="md:p-24">
      <div className={cn(PHONE_CARD, "py-8 text-center")}>
        <div className="max-w-md mx-auto space-y-4 md:space-y-6">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-rosa rounded-full flex items-center justify-center mx-auto text-viola">
              <Calendar size={28} strokeWidth={1.75} />
           </div>
           <div className="space-y-2">
             <h3 className="text-title font-display text-viola">In attesa dell&apos;azienda</h3>
             <p className="text-body md:text-lg text-viola-500">L&apos;azienda non ha ancora proposto degli slot. Riceverai una notifica appena potrai scegliere l&apos;orario.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
