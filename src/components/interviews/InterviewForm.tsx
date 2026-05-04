"use client";

import { useState } from "react";
import { Users, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { InterviewEvent } from "@/types/interview";

interface InterviewFormProps {
  onSubmit: (data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) => Promise<void>;
  loading: boolean;
}

export function InterviewForm({ onSubmit, loading }: InterviewFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [maxSlots, setMaxSlots] = useState(10);

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
      date: eventDate,
      maxSlots: Number(formData.get("maxSlots")),
      format: formData.get("format") as string,
      meetingLink: formData.get("meetingLink") as string || null,
    };

    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">
            Titolo dell&apos;Evento
          </Label>
          <Input 
            id="title"
            name="title" 
            required 
            placeholder="Es: Speed Dating Sviluppatori React" 
            className="rounded-2xl h-14 bg-white border-border-subtle focus:border-primary px-6" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">
            Descrizione (opzionale)
          </Label>
          <Textarea 
            id="description"
            name="description" 
            placeholder="Dettagli sull&apos;evento, cosa aspettarsi..." 
            className="rounded-2xl min-h-[100px] resize-none bg-white border-border-subtle focus:border-primary p-6" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Data</Label>
            <DatePicker 
              value={date} 
              onChange={setDate} 
              disablePast 
              className="h-14 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Ora di Inizio</Label>
            <TimePicker 
              value={time} 
              onChange={setTime} 
              className="h-14"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maxSlots" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">
              Posti Disponibili
            </Label>
            <div className="relative">
              <Input 
                id="maxSlots"
                name="maxSlots" 
                type="number"
                required 
                value={maxSlots}
                onChange={(e) => setMaxSlots(Number(e.target.value))}
                className="rounded-2xl h-14 bg-white border-border-subtle pl-12 pr-6 font-bold" 
              />
              <Users size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted opacity-40" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">
              Formato (es: 5min-5+2)
            </Label>
            <Input 
              id="format"
              name="format" 
              placeholder="Es: 10 min pitch + Q&A" 
              className="rounded-2xl h-14 bg-white border-border-subtle px-6" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingLink" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">
            Link Meeting (opzionale)
          </Label>
          <div className="relative">
            <Input 
              id="meetingLink"
              name="meetingLink" 
              placeholder="https://meet.google.com/..." 
              className="rounded-2xl h-14 bg-white border-border-subtle pl-12 pr-6" 
            />
            <LinkIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted opacity-40" />
          </div>
          <p className="text-[10px] text-text-muted italic px-1">Puoi aggiungerlo anche in seguito.</p>
        </div>
      </div>

      <div className="pt-6 border-t border-border-subtle/30">
        <Button 
          type="submit" 
          disabled={loading || !date} 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 bg-primary hover:bg-primary-dark transition-all"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={20} /> 
              <span>Creazione in corso...</span>
            </div>
          ) : (
            "Crea Evento Smart Interview"
          )}
        </Button>
      </div>
    </form>
  );
}
