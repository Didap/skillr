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
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPublicEventsAction } from "@/app/actions/interviews";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { InterviewEvent } from "@/types/interview";
import { useSession } from "next-auth/react";
import { formatEventMonth, formatEventDayOfMonth } from "@/lib/rome-time";
import { duration, ease } from "@/lib/motion";

type PublicEvent = InterviewEvent & {
  bookingCount: number;
  companyName: string;
  companyImage: string | null;
  companyDescription: string | null;
};

const DATE_FILTERS = ["Oggi", "Questo weekend", "Prossima settimana"];
const CATEGORY_FILTERS = ["Tech & Dev", "Marketing", "Design", "Sales"];

/** Quick filters (presentational for now): sidebar from md up, inside a bottom sheet on phones. */
function QuickFilters({ compact = false }: { compact?: boolean }) {
  const groups = [
    { title: "Data", items: DATE_FILTERS },
    { title: "Categoria", items: CATEGORY_FILTERS },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div
          key={g.title}
          className={compact ? "" : "p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow"}
        >
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3">{g.title}</p>
          <div className={compact ? "divide-y divide-slate-100" : "space-y-2"}>
            {g.items.map((f) => (
              <label key={f} className={`flex items-center gap-3 cursor-pointer group ${compact ? "min-h-12" : ""}`}>
                <span className="w-5 h-5 shrink-0 rounded-md border-2 border-slate-200 group-hover:border-emerald-500 transition-colors" />
                <span className="text-[15px] md:text-sm font-bold text-slate-600 group-hover:text-slate-950">{f}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = () => setFiltersOpen(false);

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
    <div className="min-h-screen bg-[#FDFDFC] overflow-x-clip">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl pt-safe">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-2xl md:text-3xl italic font-bold tracking-tight text-slate-900">
              Skillr<span className="text-emerald-600">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 md:gap-6 min-w-0">
            {session ? (
              <Link
                href="/dashboard"
                className="pressable inline-flex items-center justify-center rounded-full h-11 md:h-12 px-5 md:px-8 bg-slate-900 text-white text-sm font-medium hover:bg-emerald-800 transition-colors shadow-xl shadow-slate-200"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center h-11 px-3 text-sm font-bold text-slate-900 hover:opacity-70 transition-opacity">
                  Accedi
                </Link>
                <Link
                  href="/onboarding"
                  className="pressable inline-flex items-center justify-center rounded-full h-11 md:h-12 px-5 md:px-8 bg-slate-900 text-white text-sm font-medium hover:bg-emerald-800 transition-colors shadow-xl shadow-slate-200 whitespace-nowrap"
                >
                  Inizia ora
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-[calc(4rem+env(safe-area-inset-top))] md:pt-[calc(5rem+env(safe-area-inset-top))]">
        {/* Hero search */}
        <section className="relative py-12 md:py-24 bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-slate-950/80 to-slate-950" />

          <div className="relative max-w-5xl mx-auto px-4 md:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: duration.view, ease: ease.out } }}
              className="space-y-6 md:space-y-8"
            >
              <div className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={14} /> Smart Interviews Marketplace
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold italic text-white tracking-tight leading-[1.05] text-balance">
                Trova il tuo prossimo <br className="hidden md:block" />
                <span className="text-emerald-400 underline underline-offset-8 decoration-emerald-500/30">Match Professionale.</span>
              </h1>

              {/* Search bar */}
              <div className="max-w-3xl mx-auto mt-8 md:mt-12 p-2 md:p-3 bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-3 pl-3 md:px-6 h-12 md:h-14 md:border-r md:border-slate-100">
                  <Search size={20} className="text-emerald-500 shrink-0" />
                  <Input
                    type="search"
                    enterKeyHint="search"
                    aria-label="Cerca eventi, aziende o competenze"
                    placeholder="Cerca eventi, aziende o competenze..."
                    className="border-none bg-transparent focus-visible:ring-0 text-slate-900 font-bold placeholder:text-slate-400 h-full p-0 text-base md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="hidden md:flex flex-1 items-center gap-3 px-6 h-14">
                  <MapPin size={20} className="text-emerald-500 shrink-0" />
                  <Input
                    aria-label="Luogo"
                    placeholder="Tutta Italia / Online"
                    className="border-none bg-transparent focus-visible:ring-0 text-slate-900 font-bold placeholder:text-slate-400 h-full p-0 text-base md:text-base"
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  aria-label="Filtri"
                  aria-haspopup="dialog"
                  className="pressable md:hidden shrink-0 w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center"
                >
                  <SlidersHorizontal size={20} />
                </button>
                <Button className="hidden md:inline-flex h-14 px-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg transition-all active:scale-95">
                  Cerca
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <section className="py-8 md:py-20 max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-10 md:gap-12">

            {/* Sidebar: filters from md up; on phones only the promo card, after the list */}
            <aside className="order-last md:order-0 w-full md:w-72 shrink-0 space-y-10">
              <div className="hidden md:block space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Filter size={14} className="text-emerald-600" /> Filtri Rapidi
                </h4>
                <QuickFilters />
              </div>

              {/* Promo Card */}
              <div className="p-6 md:p-8 bg-emerald-600 rounded-3xl md:rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-1000 motion-reduce:transition-none" aria-hidden="true" />
                <h4 className="text-xl font-display font-bold italic mb-3 md:mb-4">Sei un&apos;azienda?</h4>
                <p className="text-[15px] md:text-sm text-emerald-50/90 font-medium mb-5 md:mb-6">Organizza le tue Smart Interviews e incontra decine di talenti in poche ore.</p>
                <Link
                  href="/onboarding"
                  className="pressable flex items-center justify-center w-full h-12 rounded-2xl border-2 border-white/30 bg-white/10 hover:bg-white hover:text-emerald-700 text-white font-bold transition-colors"
                >
                  Crea Evento
                </Link>
              </div>
            </aside>

            {/* List */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-5 md:mb-10">
                <h3 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight min-w-0 truncate">
                  {searchQuery ? `Risultati per "${searchQuery}"` : "Prossime Smart Interviews"}
                  <span className="text-slate-400 ml-2 md:ml-3 font-medium tabular-nums">({filteredEvents.length})</span>
                </h3>
                <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-400 shrink-0">
                  Ordina per: <span className="text-emerald-600 cursor-pointer flex items-center gap-1">Data Recente <ChevronRight size={14} /></span>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
                  {[1,2,3,4].map(i => (
                    <Skeleton key={i} className="h-96 md:h-[450px] bg-slate-50 rounded-3xl md:rounded-[2.5rem]" />
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
                  {filteredEvents.map((event, i) => (
                    <motion.li
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: duration.state, ease: ease.out, delay: Math.min(i * 0.04, 0.2) }}
                    >
                      <Link
                        href={session ? `/dashboard/events/${event.id}` : "/login"}
                        className="pressable group flex flex-col h-full rounded-3xl md:rounded-[2.5rem] border-2 border-slate-100 shadow-sm bg-white overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/20 transition-[box-shadow,border-color,transform] duration-200"
                      >
                        <div className="relative aspect-video md:aspect-auto md:h-56 overflow-hidden">
                          {event.imageUrl ? (
                            <Image src={event.imageUrl} alt="" fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover md:group-hover:scale-105 transition-transform duration-1000" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                              <Calendar size={56} />
                            </div>
                          )}
                          <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 md:px-5 rounded-2xl font-black shadow-xl text-center flex flex-col leading-none">
                            <span className="text-xs uppercase">{formatEventMonth(event.date)}</span>
                            <span className="text-2xl tabular-nums">{formatEventDayOfMonth(event.date)}</span>
                          </div>

                          {/* Organizer: always shown on touch, revealed on hover with a mouse */}
                          <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6 p-3 md:p-4 bg-white/90 backdrop-blur-xl rounded-2xl flex items-center gap-3 shadow-xl md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden relative shadow-sm shrink-0">
                               {event.companyImage ? (
                                 <Image src={event.companyImage} alt="" fill sizes="40px" className="object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                                   {event.companyName?.[0]}
                                 </div>
                               )}
                            </div>
                            <div className="min-w-0">
                               <p className="hidden md:block text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Organizzatore</p>
                               <p className="font-bold text-slate-900 text-sm truncate">{event.companyName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 md:p-8 flex-1 flex flex-col">
                          <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[11px] md:text-[10px] font-black uppercase tracking-[0.12em] px-3 py-1 h-auto rounded-lg max-w-full justify-start">
                              {event.topic || "Intervista"}
                            </Badge>
                            {event.format && (
                              <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-none text-[11px] md:text-[10px] font-black uppercase tracking-[0.12em] px-3 py-1 h-auto rounded-lg max-w-full truncate">
                                {event.format}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-xl md:text-2xl font-bold text-slate-950 mb-2 md:mb-4 md:group-hover:text-emerald-600 transition-colors line-clamp-2 md:min-h-16">
                            {event.title}
                          </h3>

                          <p className="text-[15px] md:text-sm text-slate-500 font-medium line-clamp-2 mb-5 md:mb-8 leading-relaxed">
                            {event.description || "Partecipa a questa sessione esclusiva per incontrare i recruiter e mostrare il tuo talento."}
                          </p>

                          <div className="mt-auto pt-5 md:pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-6 min-w-0">
                              <div className="flex flex-col">
                                <span className="text-[11px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm tabular-nums">
                                  <Users size={16} className="text-emerald-500" />
                                  <span>{event.bookingCount}/{event.maxSlots}</span>
                                </div>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Luogo</span>
                                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm min-w-0">
                                  {event.location?.toLowerCase().includes("online") ? <Globe size={16} className="text-emerald-500 shrink-0" /> : <MapPin size={16} className="text-emerald-500 shrink-0" />}
                                  <span className="truncate">{event.location || "Online"}</span>
                                </div>
                              </div>
                            </div>

                            <span className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl h-12 md:h-14 px-8 bg-slate-900 group-hover:bg-emerald-600 text-white font-bold transition-colors shadow-lg">
                              Candidati
                              <ArrowRight size={18} className="md:group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-14 md:py-20 text-center space-y-5 md:space-y-6 bg-slate-50/50 rounded-3xl md:rounded-[3rem] border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-200">
                    <Search size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">Nessun evento trovato</h3>
                    <p className="text-[15px] text-slate-500 font-medium">Prova a cambiare i filtri o la ricerca.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="pressable rounded-xl border-slate-200 px-8 h-11">
                    Mostra tutti gli eventi
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 md:py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h3 className="text-xl md:text-2xl font-bold text-slate-950 mb-6 md:mb-12 text-center">Esplora per Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
              {[
                { name: "Sviluppo Software", icon: <Sparkles size={20} /> },
                { name: "Digital Marketing", icon: <Tag size={20} /> },
                { name: "Product Design", icon: <Sparkles size={20} /> },
                { name: "Data Science", icon: <Sparkles size={20} /> },
                { name: "Cyber Security", icon: <Sparkles size={20} /> },
                { name: "Management", icon: <Sparkles size={20} /> },
              ].map(cat => (
                <div key={cat.name} className="p-4 md:p-6 bg-white rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-3 md:gap-4 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group">
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

      {/* Footer */}
      <footer className="py-12 md:py-20 border-t border-slate-100 bg-white pb-[calc(3rem+env(safe-area-inset-bottom))] md:pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
          <div className="font-display text-2xl italic font-bold text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 md:gap-12 text-sm font-bold text-slate-500">
            <Link href="/pa" className="py-2 text-emerald-600 hover:text-emerald-700 transition-colors">Skillr per la PA</Link>
            <Link href="/privacy" className="py-2 hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="py-2 hover:text-slate-900 transition-colors">Termini</Link>
            <Link href="/cookies" className="py-2 hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
          <p className="text-sm font-medium text-slate-500">
            © 2026 Skillr. Built with precision.
          </p>
        </div>
      </footer>

      {/* Phone filters */}
      <BottomSheet open={filtersOpen} onClose={closeFilters} title="Filtri">
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Luogo</p>
            <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-slate-50 text-[15px] font-bold text-slate-600">
              <MapPin size={18} className="text-emerald-500" /> Tutta Italia / Online
            </div>
          </div>
          <QuickFilters compact />
          <button
            type="button"
            onClick={closeFilters}
            className="pressable w-full h-12 rounded-2xl bg-slate-950 text-white font-bold text-[15px]"
          >
            Mostra {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventi"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
