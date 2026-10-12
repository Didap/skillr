"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/profile";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SwipeStack, SwipeStackSkeleton } from "@/components/swipe/SwipeStack";
import { getPotentialMatches } from "@/app/actions/matches";
import { User, Star, AlertTriangle, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  // Bumped on every fetch so the SwipeStack remounts with the new profiles
  const [feedVersion, setFeedVersion] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.role) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  const applyFeed = useCallback((res: Awaited<ReturnType<typeof getPotentialMatches>>) => {
    if (res.success) {
      setProfiles(res.data || []);
      setFeedError(null);
    } else {
      // Errors get their own state instead of looking like an empty feed
      setProfiles([]);
      setFeedError(res.error || "Errore durante il caricamento");
    }
    setFeedVersion((v) => v + 1);
    setLoading(false);
  }, []);

  const loadProfiles = useCallback(async () => {
    applyFeed(await getPotentialMatches());
  }, [applyFeed]);

  useEffect(() => {
    if (status === "authenticated") getPotentialMatches().then(applyFeed);
  }, [status, applyFeed]);

  const reloadFeed = async () => {
    setReloading(true);
    await loadProfiles();
    setReloading(false);
  };

  const role = session?.user?.role;
  const title = role === "company" ? "Scopri Talenti" : role ? "Nuove Opportunità" : "Scopri";
  const roleLabel = role === "company" ? "Azienda" : role === "professional" ? "Professionista" : role;
  const isLoading = status === "loading" || loading;

  if (!isLoading && !session?.user) return null;

  const user = session?.user;
  const avatar = (
    <Link
      href="/profile"
      aria-label="Il tuo profilo"
      className="pressable flex items-center gap-4 rounded-full md:rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
    >
      {user && (
        <span className="text-right hidden md:block">
          <span className="block text-sm font-bold text-slate-950">{user.name}</span>
          <span className="block text-[11px] text-emerald-600 font-black uppercase tracking-widest">{roleLabel}</span>
        </span>
      )}
      <span className="block w-11 h-11 md:w-12 md:h-12 rounded-full md:rounded-2xl bg-slate-100 border-2 border-white shadow-card overflow-hidden md:ring-4 md:ring-slate-50">
        {user?.image ? (
          <Image src={user.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-slate-400">
            <User size={22} />
          </span>
        )}
      </span>
    </Link>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <PageHeader title={title} subtitle="Basato sul tuo profilo" actions={avatar} />

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain custom-scrollbar pb-tabbar">
        <section className="relative isolate flex-1 min-h-0 lg:min-h-fit flex flex-col items-center lg:justify-center px-4 pt-3 pb-3 md:px-6 md:py-6">
          {/* Background glow, clipped to its own layer so it never widens the page */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_center,var(--color-slate-50)_0%,transparent_100%)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] max-w-[150%] bg-emerald-500/5 blur-[120px] rounded-full" />
          </div>

          <div className="w-full max-w-5xl flex-1 min-h-0 flex flex-col lg:flex-none">
            {isLoading || !user ? (
              <SwipeStackSkeleton />
            ) : feedError ? (
              <div role="alert" className="m-auto w-full max-w-md lg:max-w-2xl text-center bg-white rounded-3xl lg:rounded-[2.5rem] border border-rose-100 shadow-premium px-6 py-10 lg:p-16">
                 <div className="w-16 h-16 lg:w-20 lg:h-20 bg-rose-50 rounded-2xl lg:rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6 lg:mb-8">
                    <AlertTriangle size={32} />
                 </div>
                 <h2 className="text-3xl font-display italic text-slate-950 mb-3">Feed non disponibile</h2>
                 <p className="text-base text-slate-500 font-medium mb-8">{feedError}</p>
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   {feedError === "Profilo non trovato" && (
                     <Link
                       href="/onboarding"
                       className={cn(buttonVariants(), "pressable rounded-full h-12 px-8 bg-slate-950 hover:bg-emerald-600 font-bold w-full sm:w-auto")}
                     >
                       Completa il profilo
                     </Link>
                   )}
                   <Button
                     variant="outline"
                     onClick={reloadFeed}
                     disabled={reloading}
                     className="pressable rounded-full h-12 px-8 border-slate-200 font-bold hover:bg-slate-50 gap-2 w-full sm:w-auto"
                   >
                     <RefreshCw size={16} className={reloading ? "animate-spin motion-reduce:animate-none" : undefined} /> Riprova
                   </Button>
                 </div>
              </div>
            ) : profiles.length > 0 ? (
              <SwipeStack
                key={feedVersion}
                initialProfiles={profiles}
                userRole={user.role as "professional" | "company"}
                onReload={loadProfiles}
              />
            ) : (
              <div className="m-auto w-full max-w-md lg:max-w-2xl text-center bg-white rounded-3xl lg:rounded-[2.5rem] border border-slate-100 shadow-premium px-6 py-10 lg:p-16">
                 <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-50 rounded-2xl lg:rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 lg:mb-8">
                    <Star size={32} fill="currentColor" />
                 </div>
                 <h2 className="text-3xl font-display italic text-slate-950 mb-3">Ottimo lavoro!</h2>
                 <p className="text-base text-slate-500 font-medium mb-8">Hai visualizzato tutti i profili disponibili per oggi. Torna più tardi per nuove scoperte.</p>
                 <Button
                   variant="outline"
                   onClick={reloadFeed}
                   disabled={reloading}
                   className="pressable rounded-full h-12 px-8 border-slate-200 font-bold hover:bg-slate-50 gap-2 w-full sm:w-auto"
                 >
                   <RefreshCw size={16} className={reloading ? "animate-spin motion-reduce:animate-none" : undefined} /> Aggiorna Feed
                 </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
