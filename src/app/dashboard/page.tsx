"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/profile";
import { useEffect, useState } from "react";
import { SwipeStack } from "@/components/swipe/SwipeStack";
import { getPotentialMatches } from "@/app/actions/matches";
import Link from "next/link";
import { Zap, Calendar, User, Settings, LogOut, Briefcase, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.role) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  useEffect(() => {
    async function loadProfiles() {
      if (status === "authenticated") {
        const res = await getPotentialMatches();
        if (res.success) {
          setProfiles(res.data || []);
        }
        setLoading(false);
      }
    }
    loadProfiles();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Zap className="text-emerald-500 animate-pulse" size={48} />
           <p className="font-display italic font-bold text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFC] flex selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      {/* Premium Sidebar */}
      <aside className="w-24 md:w-72 border-r border-slate-100 bg-white flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 px-3 mb-12">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="hidden md:block font-display text-2xl italic font-black tracking-tight text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <SidebarLink href="/dashboard" icon={<Zap size={20} />} label="Match" active />
          <SidebarLink href="/matches" icon={<Calendar size={20} />} label="I miei Match" />
          {session.user.role === 'company' && (
            <SidebarLink href="/jobs" icon={<Briefcase size={20} />} label="Ricerche Attive" />
          )}
          <SidebarLink href="/profile" icon={<User size={20} />} label="Profilo" />
        </nav>

        <div className="pt-6 border-t border-slate-50 flex flex-col gap-2">
          <SidebarLink href="/settings" icon={<Settings size={20} />} label="Impostazioni" />
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-sm group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="hidden md:block">Esci</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">
              {session.user.role === 'company' ? 'Scopri Talenti' : 'Nuove Opportunità'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">
              Basato sul tuo profilo
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-950">{session.user.name}</p>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{session.user.role}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-card overflow-hidden ring-4 ring-slate-50">
               {session.user.image ? (
                 <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={24} />
                 </div>
               )}
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(circle_at_center,var(--color-slate-50)_0%,transparent_100%)]">
          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />
          
          <div className="w-full max-w-md relative">
            {profiles.length > 0 ? (
              <SwipeStack initialProfiles={profiles} userRole={session.user.role as "professional" | "company"} />
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10">
                 <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8 animate-bounce">
                    <Star size={40} fill="currentColor" />
                 </div>
                 <h2 className="text-3xl font-display font-bold italic text-slate-950 mb-4">Ottimo lavoro!</h2>
                 <p className="text-slate-500 font-medium mb-8">Hai visualizzato tutti i profili disponibili per oggi. Torna più tardi per nuove scoperte.</p>
                 <Button 
                   variant="outline" 
                   onClick={() => window.location.reload()}
                   className="rounded-full h-12 px-8 border-slate-200 font-bold hover:bg-slate-50"
                 >
                    Aggiorna Feed
                 </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm group",
        active 
          ? "bg-slate-950 text-white shadow-xl shadow-slate-200" 
          : "text-slate-400 hover:text-slate-950 hover:bg-slate-50"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-emerald-400" : "")}>
        {icon}
      </span>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
