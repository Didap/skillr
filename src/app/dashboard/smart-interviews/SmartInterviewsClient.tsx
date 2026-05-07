"use client";

import { useState } from "react";
import { 
  Zap, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { bookInterviewAction } from "@/app/actions/interviews";
import Image from "next/image";
import Link from "next/link";

interface SmartInterviewEvent {
  id: string;
  title: string;
  description: string | null;
  date: string | Date;
  maxSlots: number;
  bookingCount: number;
  companyName: string;
  companyImage: string | null;
  isBooked: boolean;
}

interface SmartInterviewsClientProps {
  initialEvents: SmartInterviewEvent[];
}

export default function SmartInterviewsClient({ initialEvents }: SmartInterviewsClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBook = async (eventId: string) => {
    setLoadingId(eventId);
    const res = await bookInterviewAction(eventId);
    if (res.success) {
      toast.success("Prenotazione effettuata con successo!");
      setEvents(events.map(e => e.id === eventId ? { ...e, isBooked: true, bookingCount: e.bookingCount + 1 } : e));
    } else {
      toast.error(res.error || "Errore durante la prenotazione");
    }
    setLoadingId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFDFC]">
      {/* Header */}
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div>
           <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Smart Interviews</h1>
           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Speed-Dating & Matching Rapido</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-bold px-4 py-1">
             {events.length} Eventi Disponibili
          </Badge>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
        <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-200/50">
          <div className="relative z-10 max-w-xl">
             <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <Zap size={28} fill="currentColor" />
             </div>
             <h2 className="text-4xl font-display italic font-bold mb-4 leading-tight">Trova il tuo prossimo team in 15 minuti.</h2>
             <p className="text-emerald-50/80 font-medium text-lg leading-relaxed">
               Partecipa alle sessioni di Smart Interview organizzate dalle migliori aziende. Prenota il tuo slot e preparati a brillare.
             </p>
          </div>
          <Zap className="absolute -right-20 -bottom-20 text-white/5 w-[400px] h-[400px] rotate-12" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-display italic font-bold text-slate-950">Eventi Disponibili</h3>
            <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 font-bold">
              {events.length} sessioni attive
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.length > 0 ? (
              events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-8 bg-white border-slate-100 rounded-[2.5rem] shadow-premium hover:shadow-xl transition-all group overflow-hidden h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-sm ring-4 ring-slate-50">
                        {event.companyImage ? (
                          <Image src={event.companyImage} alt={event.companyName} width={56} height={56} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                            {event.companyName ? event.companyName[0] : "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-0.5">Azienda Ospitante</p>
                        <h4 className="font-bold text-slate-950 truncate">{event.companyName}</h4>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <Link href={`/dashboard/events/${event.id}`}>
                        <h3 className="text-xl font-display font-bold text-slate-950 leading-snug hover:text-emerald-500 transition-colors">{event.title}</h3>
                      </Link>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{event.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold text-slate-600">
                            {format(new Date(event.date), "d MMM", { locale: it })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold text-slate-600">
                            {format(new Date(event.date), "HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Disponibilità</span>
                          <span className="text-sm font-bold text-slate-600">
                            {event.bookingCount} / {event.maxSlots} <span className="text-slate-400 font-medium">booked</span>
                          </span>
                       </div>
                       
                       {event.isBooked ? (
                         <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold text-sm border border-emerald-100">
                           <CheckCircle2 size={16} /> Iscritto
                         </div>
                       ) : event.bookingCount >= event.maxSlots ? (
                         <Badge variant="outline" className="rounded-full border-slate-100 text-slate-400 py-2 px-4">Sold Out</Badge>
                       ) : (
                         <Button 
                           onClick={() => handleBook(event.id)}
                           disabled={loadingId === event.id}
                           className="rounded-full gap-2 shadow-lg shadow-primary/10 px-6 h-11"
                         >
                           {loadingId === event.id ? <Loader2 size={16} className="animate-spin" /> : "Prenota Ora"}
                         </Button>
                       )}
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                    <Zap size={40} />
                 </div>
                 <h3 className="text-xl font-display font-bold italic text-slate-950 mb-2">Nessun evento disponibile</h3>
                 <p className="text-slate-400 mb-8 max-w-sm mx-auto">Al momento non ci sono Smart Interview programmate. Torna a trovarci presto!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
