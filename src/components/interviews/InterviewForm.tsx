"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Link as LinkIcon, Loader2, Info, MapPin, Calendar as CalendarIcon, Image as ImageIcon, Upload, Zap, Clock } from "lucide-react";
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
import { format } from "date-fns";

interface InterviewFormProps {
  onSubmit: (data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) => Promise<void>;
  loading: boolean;
  initialData?: Partial<InterviewEvent>;
  buttonText?: string;
}

export function InterviewForm({ onSubmit, loading, initialData, buttonText }: InterviewFormProps) {
  const [date, setDate] = useState<Date | undefined>(initialData?.date ? new Date(initialData.date) : new Date());
  const [time, setTime] = useState(initialData?.date ? format(new Date(initialData.date), "HH:mm") : "09:00");
  const [maxSlots, setMaxSlots] = useState(initialData?.maxSlots || 10);
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
    
    // Combine date and time
    const [hours, minutes] = time.split(":").map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      topic: formData.get("topic") as string,
      location: formData.get("location") as string,
      imageUrl: previewImage,
      tags: tags,
      date: eventDate,
      maxSlots: Number(formData.get("maxSlots")),
      format: formData.get("format") as string,
      meetingLink: formData.get("meetingLink") as string || null,
    };

    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* 1. Identità dell'Evento */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
            <ImageIcon size={20} />
          </div>
          <div>
            <h3 className="text-xl font-display italic font-bold text-slate-950">Identità & Media</h3>
            <p className="text-xs text-slate-400 font-medium">Personalizza il volto della tua Smart Interview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Immagine di Copertina</Label>
            <div 
              onClick={() => !previewImage && fileInputRef.current?.click()}
              className={`
                relative h-48 lg:h-56 rounded-[1.5rem] border-2 border-dashed transition-all duration-300 overflow-hidden group cursor-pointer
                ${previewImage ? "border-transparent shadow-md" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 bg-slate-50/50"}
              `}
            >
              {previewImage ? (
                <>
                  <Image src={previewImage} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="rounded-full h-8 px-4 font-bold text-[10px]">
                      Cambia
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="rounded-full h-8 px-4 font-bold text-[10px]">
                      Rimuovi
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-300 mb-3 group-hover:scale-105 group-hover:text-emerald-500 transition-all border border-slate-100">
                    <Upload size={20} />
                  </div>
                  <h4 className="text-slate-950 font-bold text-sm">Carica cover</h4>
                  <p className="text-[9px] text-slate-400 font-medium">PNG, JPG (16:9)</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Titolo dell&apos;Evento</Label>
              <Input id="title" name="title" defaultValue={initialData?.title || undefined} required placeholder="Es: Speed Dating per React Developers" className="rounded-2xl h-14 bg-white border-slate-200 px-6 text-base font-bold placeholder:text-slate-300 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Settore / Argomento</Label>
              <Input id="topic" name="topic" defaultValue={initialData?.topic || undefined} required placeholder="Es: Sviluppo Frontend" className="rounded-2xl h-14 bg-white border-slate-200 px-6 text-sm font-bold focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 transition-all" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Formato Sessione</Label>
              <Input id="format" name="format" defaultValue={initialData?.format || undefined} placeholder="Es: 10m Pitch + 5m Q&A" className="rounded-2xl h-14 bg-white border-slate-200 px-6 text-sm font-bold focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10 transition-all" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="tags" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Competenze in Target</Label>
              <TagInput value={tags} onChange={setTags} suggestions={suggestions} placeholder="Cerca competenze..." />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Logistica */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center border border-slate-800">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-xl font-display italic font-bold text-slate-950">Logistica & Tempo</h3>
            <p className="text-xs text-slate-400 font-medium">Gestisci orari e accessibilità</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Evento</Label>
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
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ora Inizio</Label>
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
            <Label htmlFor="maxSlots" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Posti</Label>
            <div className="relative">
              <Input 
                id="maxSlots" 
                name="maxSlots" 
                type="number" 
                required 
                value={maxSlots} 
                onChange={(e) => setMaxSlots(Number(e.target.value))} 
                className="rounded-2xl h-14 bg-white border-slate-200 pl-12 pr-4 font-bold text-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10" 
              />
              <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>
          <div className="space-y-2 md:col-span-1">
             <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sede / Modalità</Label>
             <div className="relative">
               <Input 
                 id="location" 
                 name="location" 
                 defaultValue={initialData?.location || undefined} 
                 placeholder="Online / In sede" 
                 className="rounded-2xl h-14 bg-white border-slate-200 pl-12 pr-4 text-sm font-bold focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10" 
               />
               <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingLink" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link Meeting Diretto (Opzionale)</Label>
          <div className="relative">
            <Input id="meetingLink" name="meetingLink" defaultValue={initialData?.meetingLink || undefined} placeholder="https://meet.google.com/..." className="rounded-xl h-12 bg-white border-slate-200 pl-12 pr-4 text-sm" />
            <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
        </div>
      </div>

      {/* 3. Descrizione */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <Info size={20} />
          </div>
          <div>
            <h3 className="text-xl font-display italic font-bold text-slate-950">Descrizione</h3>
            <p className="text-xs text-slate-400 font-medium">Racconta ai candidati perché partecipare</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dettagli ed Obiettivi</Label>
          <Textarea id="description" name="description" defaultValue={initialData?.description || undefined} placeholder="Descrivi il programma dell'evento..." className="rounded-2xl min-h-[140px] resize-none bg-white border-slate-200 p-6 text-sm leading-relaxed" />
        </div>
      </div>

      <div className="pt-8 flex justify-end">
        <Button 
          type="submit" 
          disabled={loading || !date} 
          className="w-full md:w-auto px-10 h-14 rounded-full text-lg font-display font-bold italic bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={20} /> 
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
