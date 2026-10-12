"use client";

import { useState, useEffect, useRef } from "react";
import { Link as LinkIcon, Loader2, Info, MapPin, Calendar as CalendarIcon, Image as ImageIcon, Upload, Zap, Clock, Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { TagInput } from "@/components/ui/tag-input";
import { InterviewEvent } from "@/types/interview";
import { getMetadataCatalog } from "@/app/actions/metadata";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { eventWallTimeToDate, getEventWallTime } from "./event-time";

interface InterviewFormProps {
  onSubmit: (data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) => Promise<void>;
  loading: boolean;
  initialData?: Partial<InterviewEvent>;
  buttonText?: string;
  /**
   * Where the submit bar sticks on phones: above the app tab bar (default), or at the very
   * bottom edge when the form sits in a full-screen layer that covers the tab bar.
   */
  stickyBar?: "tabbar" | "edge";
}

const DEFAULT_DURATION_MINUTES = 60;
const DURATION_MIN = 15;
const DURATION_MAX = 720;
const DURATION_STEP = 15;

const labelClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1";
const fieldClass =
  "rounded-2xl h-14 bg-white border-slate-200 text-base md:text-sm font-bold focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 transition-all";

// Date and time are entered as Italian wall-clock time, whatever the browser timezone.
// The date picker works with local-midnight Dates, so only its calendar day is used.
function initialDateTime(value: Date | string | undefined) {
  if (!value) return { date: new Date(), time: "09:00" };
  const w = getEventWallTime(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: new Date(w.year, w.month - 1, w.day), time: `${pad(w.hour)}:${pad(w.minute)}` };
}

function initialDuration(initialData?: Partial<InterviewEvent>) {
  if (!initialData?.date || !initialData.endTime) return DEFAULT_DURATION_MINUTES;
  const minutes = Math.round((new Date(initialData.endTime).getTime() - new Date(initialData.date).getTime()) / 60000);
  return minutes > 0 ? minutes : DEFAULT_DURATION_MINUTES;
}

function SectionTitle({ icon, tone, title, hint }: { icon: React.ReactNode; tone: string; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 md:gap-4 border-b border-slate-100 pb-3 md:pb-4">
      <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center", tone)}>{icon}</div>
      <div className="min-w-0">
        <h3 className="text-xl font-display italic font-bold text-slate-950 leading-tight">{title}</h3>
        <p className="text-[13px] md:text-xs text-slate-400 font-medium">{hint}</p>
      </div>
    </div>
  );
}

/** Number field with large -/+ buttons: spinner arrows are too small for a thumb. */
function Stepper({
  id,
  name,
  value,
  onChange,
  min,
  max,
  step,
  decreaseLabel,
  increaseLabel,
}: {
  id: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max?: number;
  step: number;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const clamp = (n: number) => Math.max(min, max !== undefined ? Math.min(max, n) : n);
  const btn =
    "pressable shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div className="flex items-center gap-1 h-14 rounded-2xl bg-white border border-slate-200 px-1.5 focus-within:border-emerald-500 transition-colors">
      <button
        type="button"
        aria-label={decreaseLabel}
        className={btn}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        <Minus size={18} />
      </button>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        required
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 w-full min-w-0 bg-transparent text-center text-base font-bold text-slate-950 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={increaseLabel}
        className={btn}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

export function InterviewForm({ onSubmit, loading, initialData, buttonText, stickyBar = "tabbar" }: InterviewFormProps) {
  const [initial] = useState(() => initialDateTime(initialData?.date));
  const [date, setDate] = useState<Date | undefined>(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(() => initialDuration(initialData));
  const [maxSlots, setMaxSlots] = useState(initialData?.maxSlots || 10);
  // When editing, seats can't go below the professionals already booked
  const minSlots = Math.max(1, initialData?.bookingCount || 0);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCatalog() {
      const res = await getMetadataCatalog();
      if (res.success) {
        const allSkills = Array.from(new Set(res.data.flatMap((c: { skills?: { label: string }[] }) => c.skills || []).map((s: { label: string }) => s.label)));
        setSuggestions(allSkills);
      }
    }
    fetchCatalog();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date) return;

    const formData = new FormData(e.currentTarget);

    // Combine the picked day and time as Italian time
    const [hours, minutes] = time.split(":").map(Number);
    const eventDate = eventWallTimeToDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), hours, minutes);
    const endTime = duration > 0 ? new Date(eventDate.getTime() + duration * 60000) : null;

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      topic: formData.get("topic") as string,
      location: formData.get("location") as string,
      imageUrl: previewImage,
      tags: tags,
      date: eventDate,
      startTime: eventDate,
      endTime,
      maxSlots: Number(formData.get("maxSlots")),
      format: formData.get("format") as string,
      meetingLink: formData.get("meetingLink") as string || null,
    };

    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 md:space-y-12">
      {/* 1. Identità dell'Evento */}
      <section className="space-y-6 md:space-y-8">
        <SectionTitle
          icon={<ImageIcon size={20} />}
          tone="bg-emerald-50 text-emerald-600 border border-emerald-100/50"
          title="Identità & Media"
          hint="Personalizza il volto della tua Smart Interview"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-4 space-y-2">
            <Label className={labelClass}>Immagine di Copertina</Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {previewImage ? (
              <div className="relative aspect-video lg:aspect-auto lg:h-56 rounded-3xl overflow-hidden shadow-md group">
                <Image src={previewImage} alt="Anteprima copertina" fill sizes="(min-width: 1024px) 320px, 100vw" className="object-cover" />
                {/* Always visible on touch, revealed on hover with a mouse */}
                <div className="absolute inset-x-0 bottom-0 p-3 flex justify-end gap-2 bg-linear-to-t from-black/50 to-transparent md:inset-0 md:items-center md:justify-center md:bg-black/40 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="pressable h-11 px-4 rounded-full bg-white text-slate-900 text-sm font-bold inline-flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw size={16} /> Cambia
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="pressable h-11 px-4 rounded-full bg-red-600 text-white text-sm font-bold inline-flex items-center gap-2 shadow-sm"
                  >
                    <Trash2 size={16} /> Rimuovi
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="pressable group w-full aspect-video lg:aspect-auto lg:h-56 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/20 transition-colors flex flex-col items-center justify-center text-center p-6"
              >
                <span className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 mb-3 group-hover:text-emerald-500 transition-colors border border-slate-100">
                  <Upload size={22} />
                </span>
                <span className="text-slate-950 font-bold text-[15px]">Carica cover</span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">PNG, JPG (16:9)</span>
              </button>
            )}
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className={labelClass}>Titolo dell&apos;Evento</Label>
              <Input id="title" name="title" defaultValue={initialData?.title || undefined} required placeholder="Es: Speed Dating per React Developers" className={cn(fieldClass, "px-5 md:px-6 md:text-base placeholder:text-slate-300")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className={labelClass}>Settore / Argomento</Label>
              <Input id="topic" name="topic" defaultValue={initialData?.topic || undefined} required placeholder="Es: Sviluppo Frontend" className={cn(fieldClass, "px-5 md:px-6")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format" className={labelClass}>Formato Sessione</Label>
              <Input id="format" name="format" defaultValue={initialData?.format || undefined} placeholder="Es: 10m Pitch + 5m Q&A" className={cn(fieldClass, "px-5 md:px-6")} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="tags" className={labelClass}>Competenze in Target</Label>
              <TagInput value={tags} onChange={setTags} suggestions={suggestions} placeholder="Cerca competenze..." />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Logistica */}
      <section className="space-y-6 md:space-y-8">
        <SectionTitle
          icon={<CalendarIcon size={20} />}
          tone="bg-slate-950 text-white border border-slate-800"
          title="Logistica & Tempo"
          hint="Gestisci orari e accessibilità"
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-5 md:gap-6">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <Label className={labelClass}>Data Evento</Label>
            <div className="relative">
              <DatePicker
                value={date}
                onChange={setDate}
                disablePast
                className="pl-12 h-14 rounded-2xl bg-white border-slate-200 hover:border-emerald-500 font-bold"
              />
              <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none z-10" />
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 space-y-2">
            <Label className={labelClass}>Ora Inizio</Label>
            <div className="relative">
              <TimePicker
                value={time}
                onChange={setTime}
                className="pl-12 h-14 rounded-2xl bg-white border-slate-200 focus-within:border-emerald-500 font-bold"
              />
              <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none z-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className={labelClass}>Durata (min)</Label>
            <Stepper
              id="duration"
              name="duration"
              value={duration}
              onChange={setDuration}
              min={DURATION_MIN}
              max={DURATION_MAX}
              step={DURATION_STEP}
              decreaseLabel="Riduci durata di 15 minuti"
              increaseLabel="Aumenta durata di 15 minuti"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxSlots" className={labelClass}>Posti</Label>
            <Stepper
              id="maxSlots"
              name="maxSlots"
              value={maxSlots}
              onChange={setMaxSlots}
              min={minSlots}
              step={1}
              decreaseLabel="Un posto in meno"
              increaseLabel="Un posto in più"
            />
          </div>
          <div className="col-span-2 lg:col-span-1 space-y-2">
             <Label htmlFor="location" className={labelClass}>Sede / Modalità</Label>
             <div className="relative">
               <Input
                 id="location"
                 name="location"
                 defaultValue={initialData?.location || undefined}
                 placeholder="Online / In sede"
                 className={cn(fieldClass, "pl-12 pr-4")}
               />
               <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingLink" className={labelClass}>Link Meeting Diretto (Opzionale)</Label>
          <div className="relative">
            <Input id="meetingLink" name="meetingLink" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" defaultValue={initialData?.meetingLink || undefined} placeholder="https://meet.google.com/..." className="rounded-2xl h-14 md:h-12 md:rounded-xl bg-white border-slate-200 pl-12 pr-4 text-base md:text-sm" />
            <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 3. Descrizione */}
      <section className="space-y-6 md:space-y-8">
        <SectionTitle
          icon={<Info size={20} />}
          tone="bg-emerald-500 text-white"
          title="Descrizione"
          hint="Racconta ai candidati perché partecipare"
        />

        <div className="space-y-2">
          <Label htmlFor="description" className={labelClass}>Dettagli ed Obiettivi</Label>
          <Textarea id="description" name="description" defaultValue={initialData?.description || undefined} placeholder="Descrivi il programma dell'evento..." className="rounded-2xl min-h-[140px] resize-none bg-white border-slate-200 p-5 md:p-6 text-base md:text-sm leading-relaxed" />
        </div>
      </section>

      {/* Submit: a sticky thumb bar on phones, a plain right-aligned button from md up */}
      <div
        className={cn(
          "sticky z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-xl border-t border-slate-100",
          "md:static md:mx-0 md:px-0 md:py-0 md:pt-8 md:bg-transparent md:backdrop-blur-none md:border-0 md:flex md:justify-end",
          stickyBar === "tabbar" ? "bottom-[calc(4rem+env(safe-area-inset-bottom))]" : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-0"
        )}
      >
        <Button
          type="submit"
          disabled={loading || !date}
          className="pressable w-full md:w-auto px-10 h-14 rounded-full text-lg font-display font-bold italic bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin motion-reduce:animate-none" size={20} />
              <span>Salvataggio...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{buttonText || "Pubblica Evento"}</span>
              <Zap size={20} fill="currentColor" />
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
