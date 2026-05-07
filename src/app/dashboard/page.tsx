"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/profile";
import { useEffect, useState } from "react";
import { SwipeStack } from "@/components/swipe/SwipeStack";
import { getPotentialMatches } from "@/app/actions/matches";
import { Zap, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">
            {session.user.role === 'company' ? 'Scopri Talenti' : 'Nuove Opportunità'}
          </h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">
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
               <Image src={session.user.image} alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={24} />
               </div>
             )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <section className="min-h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(circle_at_center,var(--color-slate-50)_0%,transparent_100%)]">
          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />
          
          <div className="w-full max-w-5xl relative">
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
      </div>
    </div>
  );
}
