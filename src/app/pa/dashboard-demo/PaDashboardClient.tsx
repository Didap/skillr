"use client";

import { motion } from "framer-motion";
import {
  Users,
  Zap,
  Calendar,
  Clock,
  TrendingUp,
  MapPin,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProvinceStat {
  name: string;
  value: number;
}

interface DashboardStats {
  totalNeet: number;
  totalMatches: number;
  totalBookings: number;
  avgPlacementDays: number;
  provinceData: ProvinceStat[];
}

// Brand hexes for the SVG map: SVG presentation attributes can't read Tailwind tokens
const MAP_FILL = "#225AD6"; // blu
const MAP_HOTSPOT = "#F6B9C9"; // rosa

export function PaDashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="h-auto bg-blu-50 text-blu-800 px-2.5 py-0.5 text-label">V2 Preview</Badge>
            <span className="text-label text-viola-500">Dashboard operatore</span>
          </div>
          <h1 className="text-title md:text-4xl md:leading-tight font-display font-bold text-viola">Impatto territoriale Puglia</h1>
          <p className="text-viola-500 mt-1">Monitoraggio in tempo reale delle politiche attive e del placement NEET.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-5">
            <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
            Filtra area
          </Button>
          <Button className="h-11 px-5">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Esporta report
          </Button>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {/* KPI Cards */}
        {[
          { title: "NEET registrati", value: initialStats.totalNeet, icon: Users, trend: "+12%", color: "text-blu", bg: "bg-blu-50" },
          { title: "Match avviati", value: initialStats.totalMatches, icon: Zap, trend: "+8%", color: "text-viola", bg: "bg-crema" },
          { title: "Colloqui fissati", value: initialStats.totalBookings, icon: Calendar, trend: "+15%", color: "text-viola", bg: "bg-rosa" },
          { title: "Placement medio", value: `${initialStats.avgPlacementDays}gg`, icon: Clock, trend: "-2gg", color: "text-blu-800", bg: "bg-blu-100" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={item}>
            <Card className="py-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${kpi.bg}`} aria-hidden="true">
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <Badge variant="outline" className="h-auto border-transparent bg-blu-50 text-blu-800 px-2 py-0.5 text-xs font-semibold">
                    <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" />
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-label text-viola-500">{kpi.title}</p>
                  <h3 className="text-3xl font-bold text-viola mt-1 tabular-nums">{kpi.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Geographic Distribution (2/3) */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 space-y-6">
          <Card className="py-0 gap-0">
            <CardHeader className="border-b border-viola/15 px-6 py-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blu" aria-hidden="true" />
                <CardTitle className="text-xl font-bold text-viola">Distribuzione per provincia</CardTitle>
              </div>
              <CardDescription>Numero di iscritti attivi suddivisi per distretto provinciale.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* Custom Bar Chart */}
                <div className="space-y-5">
                  {initialStats.provinceData.map((prov, i) => {
                    const percentage = (prov.value / initialStats.totalNeet) * 100;
                    return (
                      <div key={prov.name} className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-viola">{prov.name}</span>
                          <span className="text-viola-500 tabular-nums">{prov.value}</span>
                        </div>
                        <div className="h-3 w-full bg-blu-50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage * 2}%` }} // Adjusted for visibility
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-blu rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simplified Puglia SVG Map (Mock Visual) */}
                <div className="flex flex-col items-center justify-center bg-crema rounded-3xl p-6">
                  <div className="relative">
                    <svg width="200" height="240" viewBox="0 0 200 300" aria-hidden="true">
                      <path
                        d="M120,20 L140,40 L160,80 L180,120 L160,180 L140,240 L100,280 L60,260 L40,220 L60,160 L80,100 L100,40 Z"
                        fill={MAP_FILL}
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Hotspots */}
                      <circle cx="130" cy="80" r="6" fill={MAP_HOTSPOT} className="motion-safe:animate-ping" />
                      <circle cx="130" cy="80" r="4" fill={MAP_HOTSPOT} />

                      <circle cx="150" cy="150" r="4" fill={MAP_HOTSPOT} />
                      <circle cx="90" cy="220" r="5" fill={MAP_HOTSPOT} />
                    </svg>
                    <div className="absolute top-0 right-0 bg-white px-2.5 py-1 rounded-full border border-viola/15 text-xs font-semibold text-viola">
                      Copertura live: 94%
                    </div>
                  </div>
                  <p className="text-sm text-viola-500 mt-6 text-center">
                    Mappa dinamica della copertura territoriale.<br/>I punti rosa indicano i cluster NEET attivi.
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth & Activity (1/3) */}
        <motion.div variants={item} initial="hidden" animate="show" className="space-y-6">
          <Card className="py-0 gap-0 h-full">
            <CardHeader className="border-b border-viola/15 px-6 py-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blu" aria-hidden="true" />
                <CardTitle className="text-xl font-bold text-viola">Trend settimanale</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-48 flex items-end justify-between gap-2 mb-6" aria-hidden="true">
                {[45, 60, 40, 80, 95, 70, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className={`w-full rounded-t-md ${i === 6 ? 'bg-blu' : 'bg-blu-200'}`}
                  />
                ))}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-viola mb-2">Ultime attività</h4>
                {[
                  { user: "Luigi V.", action: "Match confermato", time: "2h fa", color: "bg-blu" },
                  { user: "Maria R.", action: "Profilo verificato", time: "5h fa", color: "bg-viola" },
                  { user: "CPI Lecce", action: "Nuova ricerca", time: "12h fa", color: "bg-rosa" },
                  { user: "Sonia G.", action: "Colloquio fissato", time: "1g fa", color: "bg-blu-300" },
                ].map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-crema transition-colors">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${act.color}`} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-viola">{act.user}</p>
                      <p className="text-label text-viola-500">{act.action}</p>
                    </div>
                    <span className="text-label text-viola-500">{act.time}</span>
                  </div>
                ))}
              </div>

              <Button variant="ghost" className="w-full mt-4 h-11 text-blu">
                Vedi tutti i log
              </Button>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Disclaimer Section */}
      <div className="mt-8 bg-white p-6 rounded-card border border-viola/15 flex items-start gap-4">
        <div className="shrink-0 h-10 w-10 bg-blu-50 rounded-full flex items-center justify-center" aria-hidden="true">
          <Clock className="h-5 w-5 text-blu" />
        </div>
        <div>
          <p className="text-sm text-viola-500 leading-relaxed">
            I dati visualizzati in questa dashboard demo sono estratti dal database reale di Helllo (Puglia Region).
            Alcuni KPI potrebbero essere simulati dove i dati storici sono insufficienti per l&apos;elaborazione statistica.
            Ultimo aggiornamento: <span className="font-semibold text-viola">{new Date().toLocaleString('it-IT')}</span>
          </p>
        </div>
      </div>

    </div>
  );
}
