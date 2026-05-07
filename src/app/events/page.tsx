"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Filter,
  ChevronRight,
  Globe,
  Tag
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { getPublicEventsAction } from "@/app/actions/interviews";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InterviewEvent } from "@/types/interview";
import { useSession } from "next-auth/react";

type PublicEvent = InterviewEvent & { 
  bookingCount: number; 
  companyName: string; 
  companyImage: string | null;
  companyDescription: string | null;
};

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      const res = await getPublicEventsAction();
      if (res.success && res.data) {
        setEvents(res.data as PublicEvent[]);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-3xl italic font-bold tracking-tight text-slate-900">
              Skillr<span className="text-emerald-600">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            {session ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-8 h-12 bg-slate-900 text-white hover:bg-emerald-800 transition-all shadow-xl shadow-slate-200">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-slate-900 hover:opacity-70 transition-opacity">
                  Accedi
                </Link>
                <Link href="/onboarding">
                  <Button className="rounded-full px-8 h-12 bg-slate-900 text-white hover:bg-emerald-800 transition-all shadow-xl shadow-slate-200">
                    Inizia ora
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Search Area - Eventbrite style */}
        <section className="relative py-24 bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-slate-950/80 to-slate-950" />
          
          <div className="relative max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={14} /> Smart Interviews Marketplace
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold italic text-white tracking-tight">
                Trova il tuo prossimo <br />
                <span className="text-emerald-400 underline underline-offset-8 decoration-emerald-500/30">Match Professionale.</span>
              </h1>
              
              {/* Search Bar - Premium Float */}
              <div className="max-w-3xl mx-auto mt-12 p-3 bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 w-full flex items-center gap-3 px-6 h-14 border-r border-slate-100 last:border-0">
                  <Search size={20} className="text-emerald-500" />
                  <Input 
                    placeholder="Cerca eventi, aziende o competenze..." 
                    className="border-none bg-transparent focus-visible:ring-0 text-slate-900 font-bold placeholder:text-slate-300 h-full p-0 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="hidden md:flex flex-1 items-center gap-3 px-6 h-14 border-r border-slate-100 last:border-0">
                  <MapPin size={20} className="text-emerald-500" />
                  <Input 
                    placeholder="Tutta Italia / Online" 
                    className="border-none bg-transparent focus-visible:ring-0 text-slate-900 font-bold placeholder:text-slate-300 h-full p-0 text-base"
                    readOnly
                  />
                </div>
                <Button className="w-full md:w-auto h-14 px-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg transition-all active:scale-95">
                  Cerca
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12">
            
            {/* Sidebar Filters - Eventbrite style */}
            <aside className="w-full md:w-72 shrink-0 space-y-10">
              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Filter size={14} className="text-emerald-600" /> Filtri Rapidi
                </h4>
                
                <div className="space-y-4">
                  <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Data</p>
                    <div className="space-y-2">
                      {["Oggi", "Questo weekend", "Prossima settimana"].map(f => (
                        <label key={f} className="flex items-center gap-3 cursor-pointer group">
                          <div className="w-5 h-5 rounded-md border-2 border-slate-100 group-hover:border-emerald-500 transition-colors" />
                          <span className="text-sm font-bold text-slate-600 group-hover:text-slate-950">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categoria</p>
                    <div className="space-y-2">
                      {["Tech & Dev", "Marketing", "Design", "Sales"].map(f => (
                        <label key={f} className="flex items-center gap-3 cursor-pointer group">
                          <div className="w-5 h-5 rounded-md border-2 border-slate-100 group-hover:border-emerald-500 transition-colors" />
                          <span className="text-sm font-bold text-slate-600 group-hover:text-slate-950">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Card */}
              <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                <h4 className="text-xl font-display font-bold italic mb-4">Sei un&apos;azienda?</h4>
                <p className="text-sm text-emerald-50 font-medium mb-6 opacity-80">Organizza le tue Smart Interviews e incontra decine di talenti in poche ore.</p>
                <Link href="/onboarding">
                  <Button variant="outline" className="w-full rounded-2xl border-white/30 bg-white/10 hover:bg-white hover:text-emerald-600 text-white font-bold border-2 transition-all">
                    Crea Evento
                  </Button>
                </Link>
              </div>
            </aside>

            {/* Grid Area */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {searchQuery ? `Risultati per "${searchQuery}"` : "Prossime Smart Interviews"} 
                  <span className="text-slate-300 ml-3 font-medium">({filteredEvents.length})</span>
                </h3>
                <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-400">
                  Ordina per: <span className="text-emerald-600 cursor-pointer flex items-center gap-1">Data Recente <ChevronRight size={14} /></span>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-[450px] bg-slate-50 animate-pulse rounded-[2.5rem]" />
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="group flex flex-col h-full rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 border-2 hover:border-emerald-500/20">
                        <div className="relative h-56 overflow-hidden">
                          {event.imageUrl ? (
                            <Image src={event.imageUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                              <Calendar size={64} />
                            </div>
                          )}
                          <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <Badge className="bg-white/95 backdrop-blur-md text-slate-900 border-none px-5 py-2 rounded-2xl font-black shadow-xl text-center flex flex-col leading-none">
                              <span className="text-xs uppercase">{format(new Date(event.date), "MMM", { locale: it })}</span>
                              <span className="text-2xl">{format(new Date(event.date), "d", { locale: it })}</span>
                            </Badge>
                          </div>
                          
                          {/* Floating Company Mini Card */}
                          <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-xl rounded-2xl flex items-center gap-3 shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden relative shadow-sm shrink-0">
                               {event.companyImage ? (
                                 <Image src={event.companyImage} alt={event.companyName} fill className="object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-xs uppercase">
                                   {event.companyName?.[0]}
                                 </div>
                               )}
                            </div>
                            <div className="min-w-0">
                               <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Organizzatore</p>
                               <p className="font-bold text-slate-900 text-sm truncate">{event.companyName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-lg">
                              {event.topic || "Intervista"}
                            </Badge>
                            {event.format && (
                              <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-lg">
                                {event.format}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-2xl font-bold text-slate-950 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-16">
                            {event.title}
                          </h3>
                          
                          <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 leading-relaxed">
                            {event.description || "Partecipa a questa sessione esclusiva per incontrare i recruiter e mostrare il tuo talento."}
                          </p>

                          <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</span>
                                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm">
                                  <Users size={16} className="text-emerald-500" />
                                  <span>{event.bookingCount}/{event.maxSlots}</span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Luogo</span>
                                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm">
                                  {event.location?.toLowerCase().includes("online") ? <Globe size={16} className="text-emerald-500" /> : <MapPin size={16} className="text-emerald-500" />}
                                  <span className="truncate max-w-[100px]">{event.location || "Online"}</span>
                                </div>
                              </div>
                            </div>

                            <Link href={session ? `/dashboard/events/${event.id}` : "/login"}>
                              <Button className="rounded-2xl h-14 px-8 bg-slate-900 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg group/btn flex items-center gap-2">
                                Candidati
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-200">
                    <Search size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">Nessun evento trovato</h3>
                    <p className="text-slate-400 font-medium">Prova a cambiare i filtri o la ricerca.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl border-slate-200 px-8">
                    Mostra tutti gli eventi
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Categories Section - Eventbrite style */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-2xl font-bold text-slate-950 mb-12 text-center">Esplora per Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { name: "Sviluppo Software", icon: <Sparkles size={20} /> },
                { name: "Digital Marketing", icon: <Tag size={20} /> },
                { name: "Product Design", icon: <Sparkles size={20} /> },
                { name: "Data Science", icon: <Sparkles size={20} /> },
                { name: "Cyber Security", icon: <Sparkles size={20} /> },
                { name: "Management", icon: <Sparkles size={20} /> },
              ].map(cat => (
                <div key={cat.name} className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-4 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {cat.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Standard Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="font-display text-2xl italic font-bold text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </div>
          <div className="flex gap-12 text-sm font-bold text-slate-400">
            <Link href="/pa" className="text-emerald-600 hover:text-emerald-700 transition-colors">Skillr per la PA</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Termini</Link>
            <Link href="/cookies" className="hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
          <p className="text-sm font-medium text-slate-400">
            © 2026 Skillr. Built with precision.
          </p>
        </div>
      </footer>
    </div>
  );
}
