"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Calendar, MapPin, ExternalLink, Plus, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const slots = [
    "Lun 10 Maggio, 09:00 - 09:30",
    "Lun 10 Maggio, 14:00 - 14:30",
    "Mar 11 Maggio, 11:00 - 11:30",
    "Mer 12 Maggio, 16:30 - 17:00",
  ];

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else if (selectedSlots.length < 3) {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-20 border-b border-border-subtle bg-white flex items-center px-6 shrink-0 sticky top-0 z-10">
        <Link href="/matches" className="text-text-secondary hover:text-primary transition-colors mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="font-semibold text-text-primary">Dettaglio Match</h1>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <section className="bg-white rounded-3xl border border-border-subtle shadow-card overflow-hidden mb-8">
          <div className="p-8 md:p-12 border-b border-border-subtle">
             <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 rounded-3xl bg-emerald-800 shrink-0 flex items-center justify-center text-white/20 font-display text-6xl italic font-bold">
                   E
                </div>
                <div className="flex-1 space-y-4">
                   <div>
                      <h2 className="text-3xl font-bold text-text-primary">Elena Valeri</h2>
                      <p className="text-xl text-primary italic">Senior UX Architect</p>
                   </div>
                   <div className="flex flex-wrap gap-4 text-text-secondary text-sm">
                      <div className="flex items-center gap-2"><MapPin size={16} /> Milano / Remote</div>
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium italic">
                         <Mail size={14} /> elena.valeri@example.com
                      </div>
                   </div>
                </div>
                <Button variant="outline" className="rounded-full border-border-strong gap-2">
                   Vedi Profilo <ExternalLink size={14} />
                </Button>
             </div>
          </div>

          <div className="p-8 md:p-12 bg-surface-warm/30">
             <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex-1">
                   <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                      <Calendar className="text-primary" size={20} /> Pianifica la tua call
                   </h3>
                   <p className="text-text-secondary">Proponi 2-3 slot orari per un primo incontro conoscitivo di 15-30 minuti.</p>
                </div>
                {!showBooking && (
                  <Button onClick={() => setShowBooking(true)} className="rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/20 gap-2">
                    <Plus size={20} /> Proponi Slot
                  </Button>
                )}
             </div>

             <AnimatePresence>
                {showBooking && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-12 space-y-8"
                  >
                     <div className="grid sm:grid-cols-2 gap-3">
                        {slots.map(slot => (
                          <button 
                            key={slot}
                            onClick={() => toggleSlot(slot)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                              selectedSlots.includes(slot) 
                                ? "bg-primary border-primary text-white" 
                                : "bg-white border-border-subtle hover:border-primary text-text-primary"
                            }`}
                          >
                             <div className="flex items-center gap-3">
                                <Clock size={18} className={selectedSlots.includes(slot) ? "text-emerald-200" : "text-primary"} />
                                <span className="font-medium">{slot}</span>
                             </div>
                             {selectedSlots.includes(slot) && <Check size={18} />}
                          </button>
                        ))}
                     </div>
                     
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-subtle">
                        <p className="text-sm text-text-muted">
                           Hai selezionato <span className="font-bold text-text-primary">{selectedSlots.length}</span> di 3 slot massimi.
                        </p>
                        <div className="flex gap-3">
                           <Button variant="ghost" onClick={() => setShowBooking(false)} className="rounded-full">Annulla</Button>
                           <Button disabled={selectedSlots.length === 0} className="rounded-full px-8 h-12 shadow-md shadow-primary/10">
                              Invia Proposta
                           </Button>
                        </div>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
