"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, User, Calendar, Mail, Zap, ChevronRight, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMatches } from "@/app/actions/matches";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadMatches() {
      if (status === "authenticated") {
        const res = await getMatches();
        if (res.success) {
          setMatches(res.data || []);
        }
        setLoading(false);
      }
    }
    loadMatches();
  }, [status]);

  const filteredMatches = matches.filter(m => 
    m.targetName.toLowerCase().includes(search.toLowerCase()) ||
    m.targetTitle?.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Zap className="text-emerald-500 animate-pulse" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFC] flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center px-10 sticky top-0 z-40">
        <Link 
          href="/dashboard" 
          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="ml-6">
           <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">I Tuoi Match</h1>
           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">L'inizio di qualcosa di grande</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
             <Mail size={24} />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-1 text-lg">Zero Chat, Massima Efficienza</h3>
            <p className="text-sm text-emerald-700/80 font-medium">
               Su Skillr non si perde tempo a chattare. Entra nel match, guarda gli slot proposti e fissa la tua videochiamata conoscitiva.
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <div className="mb-10 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <Input 
            placeholder="Cerca per nome o ruolo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-16 pr-6 rounded-2xl h-16 bg-white border-slate-100 shadow-premium focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-lg"
          />
        </div>

        {/* Matches Grid */}
        <div className="grid gap-4">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/matches/${match.id}`}>
                  <div className="group flex items-center gap-6 p-6 rounded-[2rem] bg-white border border-slate-50 shadow-card hover:shadow-premium hover:border-emerald-100 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform ring-4 ring-slate-50">
                      {match.targetImage ? (
                        <img src={match.targetImage} alt={match.targetName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-display text-3xl italic font-bold">
                          {match.targetName[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xl font-bold text-slate-950 truncate group-hover:text-emerald-700 transition-colors">
                          {match.targetName}
                        </h3>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest px-2 py-1">
                          Nuovo Match
                        </Badge>
                      </div>
                      <p className="text-sm text-emerald-600 font-bold italic truncate mb-3">{match.targetTitle}</p>
                      
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-emerald-500" />
                          <span>Fissa la call</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{new Date(match.matchedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                       <ChevronRight size={24} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                  <Star size={40} />
               </div>
               <h3 className="text-2xl font-display font-bold italic text-slate-400">Ancora nessun match</h3>
               <p className="text-slate-400 font-medium mt-2">Torna allo swipe per trovare il tuo prossimo collaboratore.</p>
               <Link href="/dashboard">
                  <Button className="mt-8 rounded-full h-12 px-8 bg-slate-950 hover:bg-emerald-800 transition-all">
                    Inizia ora
                  </Button>
               </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
