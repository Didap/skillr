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
            <Badge variant="secondary" className="bg-pa-blue/10 text-pa-blue border-none font-bold">V2 Preview</Badge>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Dashboard Operatore</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-pa-blue">Impatto Territoriale Puglia</h1>
          <p className="text-text-secondary mt-1 font-medium">Monitoraggio in tempo reale delle politiche attive e del placement NEET.</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-pa-blue/20 text-pa-blue bg-white shadow-sm hover:bg-pa-gray-cold h-11">
            <Filter className="mr-2 h-4 w-4" />
            Filtra Area
          </Button>
          <Button className="bg-pa-blue text-white hover:bg-pa-blue-dark shadow-lg shadow-pa-blue/20 h-11">
            <Download className="mr-2 h-4 w-4" />
            Esporta Report
          </Button>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
      >
        {/* KPI Cards */}
        {[
          { title: "NEET Registrati", value: initialStats.totalNeet, icon: Users, trend: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Match Avviati", value: initialStats.totalMatches, icon: Zap, trend: "+8%", color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Colloqui Fissati", value: initialStats.totalBookings, icon: Calendar, trend: "+15%", color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Placement Avg", value: `${initialStats.avgPlacementDays}gg`, icon: Clock, trend: "-2gg", color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={item}>
            <Card className="border-none shadow-premium bg-white overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${kpi.bg}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  <Badge variant="outline" className="border-none bg-green-50 text-green-700 text-[10px] font-bold">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-text-muted uppercase tracking-wider">{kpi.title}</p>
                  <h3 className="text-3xl font-bold text-pa-blue mt-1">{kpi.value}</h3>
                </div>
              </CardContent>
              <div className={`h-1 w-full bg-linear-to-r from-transparent via-pa-blue/20 to-transparent absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Geographic Distribution (2/3) */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-premium bg-white">
            <CardHeader className="border-b border-pa-gray-cold/50 pb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pa-blue" />
                <CardTitle className="text-xl font-bold text-pa-blue">Distribuzione per Provincia</CardTitle>
              </div>
              <CardDescription>Numero di iscritti attivi suddivisi per distretto provinciale.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Custom Bar Chart */}
                <div className="space-y-6">
                  {initialStats.provinceData.map((prov, i) => {
                    const percentage = (prov.value / initialStats.totalNeet) * 100;
                    return (
                      <div key={prov.name} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-pa-blue">{prov.name}</span>
                          <span className="text-text-muted">{prov.value}</span>
                        </div>
                        <div className="h-3 w-full bg-pa-gray-cold rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage * 2}%` }} // Adjusted for visibility
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-pa-blue rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simplified Puglia SVG Map (Mock Visual) */}
                <div className="flex flex-col items-center justify-center bg-pa-gray-cold/30 rounded-2xl p-6 border border-pa-gray-cold">
                  <div className="relative">
                    <svg width="200" height="240" viewBox="0 0 200 300" className="drop-shadow-2xl">
                      <path 
                        d="M120,20 L140,40 L160,80 L180,120 L160,180 L140,240 L100,280 L60,260 L40,220 L60,160 L80,100 L100,40 Z" 
                        fill="#0f4c81" 
                        stroke="white" 
                        strokeWidth="2"
                        className="animate-pulse duration-3000"
                      />
                      {/* Hotspots */}
                      <circle cx="130" cy="80" r="6" fill="#fbbf24" className="animate-ping" />
                      <circle cx="130" cy="80" r="4" fill="#fbbf24" />
                      
                      <circle cx="150" cy="150" r="4" fill="#fbbf24" />
                      <circle cx="90" cy="220" r="5" fill="#fbbf24" />
                    </svg>
                    <div className="absolute top-0 right-0 bg-white p-2 rounded-lg shadow-sm border border-pa-gray-cold text-[10px] font-bold">
                      LIVE COVERAGE: 94%
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-6 text-center font-medium">
                    Mappa dinamica della copertura territoriale.<br/>I punti gialli indicano i cluster NEET attivi.
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth & Activity (1/3) */}
        <motion.div variants={item} initial="hidden" animate="show" className="space-y-6">
          <Card className="border-none shadow-premium bg-white h-full">
            <CardHeader className="border-b border-pa-gray-cold/50 pb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-pa-blue" />
                <CardTitle className="text-xl font-bold text-pa-blue">Trend Settimanale</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-48 flex items-end justify-between gap-2 mb-6">
                {[45, 60, 40, 80, 95, 70, 100].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className={`w-full rounded-t-md ${i === 6 ? 'bg-pa-blue' : 'bg-pa-blue/20'}`}
                  />
                ))}
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Ultime Attività</h4>
                {[
                  { user: "Luigi V.", action: "Match Confermato", time: "2h fa", color: "bg-emerald-500" },
                  { user: "Maria R.", action: "Profilo Verificato", time: "5h fa", color: "bg-blue-500" },
                  { user: "CPI Lecce", action: "Nuova Ricerca", time: "12h fa", color: "bg-amber-500" },
                  { user: "Sonia G.", action: "Colloquio Fissato", time: "1g fa", color: "bg-purple-500" },
                ].map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-pa-gray-cold transition-colors">
                    <div className={`h-2 w-2 rounded-full ${act.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-pa-blue">{act.user}</p>
                      <p className="text-[10px] text-text-muted font-medium uppercase tracking-tighter">{act.action}</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-bold">{act.time}</span>
                  </div>
                ))}
              </div>
              
              <Button variant="ghost" className="w-full mt-6 text-pa-blue font-bold text-xs hover:bg-pa-blue/5">
                VEDI TUTTI I LOG
              </Button>
            </CardContent>
          </Card>
        </motion.div>

      </div>
      
      {/* Disclaimer Section */}
      <div className="mt-12 bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white flex items-start gap-4">
        <div className="shrink-0 p-2 bg-pa-blue/10 rounded-lg">
          <Clock className="h-5 w-5 text-pa-blue" />
        </div>
        <div>
          <p className="text-xs text-text-muted font-medium leading-relaxed">
            I dati visualizzati in questa dashboard demo sono estratti dal database reale di Skillr (Puglia Region). 
            Alcuni KPI potrebbero essere simulati dove i dati storici sono insufficienti per l&apos;elaborazione statistica.
            Ultimo aggiornamento: <span className="font-bold text-pa-blue">{new Date().toLocaleString('it-IT')}</span>
          </p>
        </div>
      </div>

    </div>
  );
}
