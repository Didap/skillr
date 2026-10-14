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
import { Button, buttonVariants } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/brand/Logo";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { InterviewEvent } from "@/types/interview";
import { useSession } from "next-auth/react";
import { formatEventMonth, formatEventDayOfMonth } from "@/lib/rome-time";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

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
    <div className="space-y-3">
      {groups.map((g) => (
        <div
          key={g.title}
          className={compact ? "" : "p-5 bg-white border border-viola/15 rounded-card"}
        >
          <p className="text-label text-viola-500 mb-2 md:mb-3">{g.title}</p>
          <div className={compact ? "divide-y divide-viola/15" : "space-y-2"}>
            {g.items.map((f) => (
              <label key={f} className={`flex items-center gap-3 cursor-pointer group ${compact ? "min-h-12" : ""}`}>
                <span className="w-5 h-5 shrink-0 rounded-md border border-viola/40 bg-white group-hover:border-viola transition-colors" />
                <span className="text-[15px] md:text-sm font-medium text-viola">{f}</span>
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
    <div className="min-h-screen bg-background overflow-x-clip">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-viola/15 bg-white pt-safe">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <Link href="/" aria-label="Helllo, home" className="shrink-0 rounded-full">
            <Logo title={null} className="h-7 md:h-9" />
          </Link>
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {session ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "default" }), "h-11 md:h-12 px-5 md:px-8 text-sm")}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 md:h-12 px-4 md:px-6 text-sm")}
                >
                  Accedi
                </Link>
                <Link
                  href="/onboarding"
                  className={cn(buttonVariants({ variant: "default" }), "h-11 md:h-12 px-5 md:px-8 text-sm")}
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
        <section className="py-12 md:py-24 bg-viola">
          <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: duration.view, ease: ease.out } }}
              className="space-y-6 md:space-y-8"
            >
              <p className="hidden md:inline-flex items-center rounded-full bg-rosa px-4 py-2 text-chip text-viola">
                Smart Interviews Marketplace
              </p>
              <h1 className="font-display text-display sm:text-5xl md:text-7xl sm:leading-[1.05] md:leading-[1.05] tracking-[-0.03em] text-white text-balance">
                Trova il tuo prossimo{" "}
                <span className="font-script text-rosa">match</span>{" "}
                professionale.
              </h1>

              {/* Search bar */}
              <div className="max-w-3xl mx-auto mt-8 md:mt-12 p-2 bg-white rounded-full shadow-card flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-3 pl-4 md:px-6 h-12 md:h-14 md:border-r md:border-viola/15">
                  <Search size={20} strokeWidth={1.75} className="text-viola shrink-0" />
                  <Input
                    type="search"
                    enterKeyHint="search"
                    aria-label="Cerca eventi, aziende o competenze"
                    placeholder="Cerca eventi, aziende o competenze..."
                    className="border-none bg-transparent focus-visible:ring-0 text-viola font-semibold placeholder:text-viola-400 h-full p-0 text-base md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="hidden md:flex flex-1 items-center gap-3 px-6 h-14">
                  <MapPin size={20} strokeWidth={1.75} className="text-viola shrink-0" />
                  <Input
                    aria-label="Luogo"
                    placeholder="Tutta Italia / Online"
                    className="border-none bg-transparent focus-visible:ring-0 text-viola font-semibold placeholder:text-viola-400 h-full p-0 text-base md:text-base"
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  aria-label="Filtri"
                  aria-haspopup="dialog"
                  className="pressable md:hidden shrink-0 size-12 rounded-full border border-viola bg-white text-viola flex items-center justify-center"
                >
                  <SlidersHorizontal size={20} strokeWidth={1.75} />
                </button>
                <Button className="hidden md:inline-flex h-14 px-10 text-lg">
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
              <div className="hidden md:block space-y-4">
                <h2 className="text-base font-bold text-viola flex items-center gap-2">
                  <Filter size={16} strokeWidth={1.75} /> Filtri rapidi
                </h2>
                <QuickFilters />
              </div>

              {/* Promo Card */}
              <div className="p-6 md:p-8 bg-blu rounded-card text-white">
                <h2 className="text-title mb-3">Sei un&apos;azienda?</h2>
                <p className="text-[15px] md:text-sm text-white mb-5 md:mb-6 leading-relaxed">Organizza le tue Smart Interviews e incontra decine di talenti in poche ore.</p>
                <Link
                  href="/onboarding"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full h-12 text-base")}
                >
                  Crea Evento
                </Link>
              </div>
            </aside>

            {/* List */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-5 md:mb-10">
                <h2 className="text-xl md:text-title text-viola font-bold tracking-tight min-w-0 truncate">
                  {searchQuery ? `Risultati per "${searchQuery}"` : "Prossime Smart Interviews"}
                  <span className="text-viola-400 ml-2 md:ml-3 font-medium tabular-nums">({filteredEvents.length})</span>
                </h2>
                <div className="hidden sm:flex items-center gap-2 text-sm text-viola-500 shrink-0">
                  Ordina per: <span className="text-viola font-semibold underline decoration-viola/40 underline-offset-4 cursor-pointer flex items-center gap-1">Data recente <ChevronRight size={14} /></span>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {[1,2,3,4].map(i => (
                    <Skeleton key={i} className="h-96 md:h-[450px] bg-crema rounded-card" />
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {filteredEvents.map((event, i) => (
                    <motion.li
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: duration.state, ease: ease.out, delay: Math.min(i * 0.04, 0.2) }}
                    >
                      <Link
                        href={session ? `/dashboard/events/${event.id}` : "/login"}
                        className="pressable group flex flex-col h-full rounded-card border border-viola/15 bg-white overflow-hidden hover:border-viola/40 transition-[border-color,scale] duration-200"
                      >
                        <div className="relative aspect-video md:aspect-auto md:h-56 overflow-hidden">
                          {event.imageUrl ? (
                            <Image src={event.imageUrl} alt="" fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover md:group-hover:scale-105 transition-transform duration-1000 motion-reduce:transition-none" />
                          ) : (
                            <div className="w-full h-full bg-crema flex items-center justify-center text-viola-300">
                              <Calendar size={56} strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-rosso text-white px-4 py-2 md:px-5 rounded-2xl font-bold text-center flex flex-col leading-none">
                            <span className="text-xs">{formatEventMonth(event.date)}</span>
                            <span className="text-2xl tabular-nums">{formatEventDayOfMonth(event.date)}</span>
                          </div>

                          {/* Organizer: always shown on touch, revealed on hover with a mouse */}
                          <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6 p-3 md:p-4 bg-white rounded-2xl flex items-center gap-3 shadow-card md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 motion-reduce:transition-none">
                            <div className="size-10 rounded-full bg-crema overflow-hidden relative shrink-0">
                               {event.companyImage ? (
                                 <Image src={event.companyImage} alt="" fill sizes="40px" className="object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-viola font-bold text-sm">
                                   {event.companyName?.[0]}
                                 </div>
                               )}
                            </div>
                            <div className="min-w-0">
                               <p className="hidden md:block text-label text-viola-500 mb-0.5">Organizzatore</p>
                               <p className="font-bold text-viola text-sm truncate">{event.companyName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 md:p-7 flex-1 flex flex-col text-viola">
                          <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                            <Badge className="h-auto px-3 py-1 text-[13px] max-w-full justify-start">
                              {event.topic || "Intervista"}
                            </Badge>
                            {event.format && (
                              <Badge variant="secondary" className="h-auto px-3 py-1 text-[13px] max-w-full truncate">
                                {event.format}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 underline-offset-4 decoration-viola/40 md:group-hover:underline line-clamp-2 md:min-h-16">
                            {event.title}
                          </h3>

                          <p className="text-[15px] md:text-sm text-viola-500 line-clamp-2 mb-5 md:mb-7 leading-relaxed">
                            {event.description || "Partecipa a questa sessione esclusiva per incontrare i recruiter e mostrare il tuo talento."}
                          </p>

                          <div className="mt-auto pt-5 md:pt-7 border-t border-viola/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-6 min-w-0">
                              <div className="flex flex-col">
                                <span className="text-label text-viola-500 mb-1">Status</span>
                                <div className="flex items-center gap-1.5 font-semibold text-sm tabular-nums">
                                  <Users size={16} strokeWidth={1.75} />
                                  <span>{event.bookingCount}/{event.maxSlots}</span>
                                </div>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-label text-viola-500 mb-1">Luogo</span>
                                <div className="flex items-center gap-1.5 font-semibold text-sm min-w-0">
                                  {event.location?.toLowerCase().includes("online") ? <Globe size={16} strokeWidth={1.75} className="shrink-0" /> : <MapPin size={16} strokeWidth={1.75} className="shrink-0" />}
                                  <span className="truncate">{event.location || "Online"}</span>
                                </div>
                              </div>
                            </div>

                            <span className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full h-12 px-7 bg-rosso group-hover:bg-rosso-600 text-white font-bold transition-colors">
                              Candidati
                              <ArrowRight size={18} className="md:group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-14 md:py-20 text-center space-y-5 md:space-y-6 bg-crema rounded-card">
                  <div className="size-16 md:size-20 bg-white rounded-full flex items-center justify-center text-viola">
                    <Search size={30} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-viola">Nessun evento trovato</h3>
                    <p className="text-[15px] text-viola-500">Prova a cambiare i filtri o la ricerca.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="px-8 h-11 text-sm">
                    Mostra tutti gli eventi
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 md:py-20 bg-crema">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-xl md:text-title font-bold text-viola mb-6 md:mb-12 text-center">Esplora per categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {[
                { name: "Sviluppo Software", icon: <Sparkles size={20} strokeWidth={1.75} /> },
                { name: "Digital Marketing", icon: <Tag size={20} strokeWidth={1.75} /> },
                { name: "Product Design", icon: <Sparkles size={20} strokeWidth={1.75} /> },
                { name: "Data Science", icon: <Sparkles size={20} strokeWidth={1.75} /> },
                { name: "Cyber Security", icon: <Sparkles size={20} strokeWidth={1.75} /> },
                { name: "Management", icon: <Sparkles size={20} strokeWidth={1.75} /> },
              ].map(cat => (
                <div key={cat.name} className="p-4 md:p-6 bg-white rounded-card border border-transparent flex flex-col items-center text-center gap-3 md:gap-4 hover:border-viola/40 transition-colors cursor-pointer group">
                  <div className="size-12 bg-rosa text-viola rounded-full flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <span className="text-sm font-semibold text-viola">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        note="© 2026 Helllo. Built with precision."
        className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-20"
      />

      {/* Phone filters */}
      <BottomSheet open={filtersOpen} onClose={closeFilters} title="Filtri">
        <div className="space-y-6">
          <div>
            <p className="text-label text-viola-500 mb-2">Luogo</p>
            <div className="flex items-center gap-3 h-12 px-4 rounded-full bg-crema text-[15px] font-medium text-viola">
              <MapPin size={18} strokeWidth={1.75} /> Tutta Italia / Online
            </div>
          </div>
          <QuickFilters compact />
          <button
            type="button"
            onClick={closeFilters}
            className={cn(buttonVariants({ variant: "default" }), "w-full h-12 text-[15px]")}
          >
            Mostra {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventi"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
