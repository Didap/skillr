"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/profile";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SwipeStack, SwipeStackSkeleton } from "@/components/swipe/SwipeStack";
import { getPotentialMatches } from "@/app/actions/matches";
import { User, AlertTriangle, RefreshCw } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";
import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
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
  const title = role === "company" ? "Scopri talenti" : role ? "Nuove opportunità" : "Scopri";
  const roleLabel = role === "company" ? "Azienda" : role === "professional" ? "Professionista" : role;
  const isLoading = status === "loading" || loading;

  if (!isLoading && !session?.user) return null;

  const user = session?.user;
  const avatar = (
    <Link
      href="/profile"
      aria-label="Il tuo profilo"
      className="pressable flex items-center gap-3 rounded-full"
    >
      {user && (
        <span className="text-right hidden md:block">
          <span className="block text-sm font-bold text-viola">{user.name}</span>
          <span className="block text-label text-viola-500">{roleLabel}</span>
        </span>
      )}
      <span className="block size-11 md:size-12 rounded-full bg-rosa overflow-hidden">
        {user?.image ? (
          <Image src={user.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-viola">
            <User size={22} strokeWidth={1.75} />
          </span>
        )}
      </span>
    </Link>
  );

  // Error and empty feed share one friendly crema block
  const stateCard = "m-auto w-full max-w-md lg:max-w-xl text-center bg-crema rounded-card px-6 py-10 lg:p-14";
  const refreshButton = (label: string) => (
    <Button
      variant="outline"
      onClick={reloadFeed}
      disabled={reloading}
      className="h-12 px-8 text-base gap-2 w-full sm:w-auto"
    >
      <RefreshCw size={16} className={reloading ? "animate-spin motion-reduce:animate-none" : undefined} /> {label}
    </Button>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <PageHeader title={title} subtitle="Basato sul tuo profilo" actions={avatar} />

      <PageBody className="min-h-0 flex flex-col custom-scrollbar">
        <section className="relative flex-1 min-h-0 lg:min-h-fit flex flex-col items-center lg:justify-center px-4 pt-3 pb-3 md:px-6 md:py-6">
          <div className="w-full max-w-5xl flex-1 min-h-0 flex flex-col lg:flex-none">
            {isLoading || !user ? (
              <SwipeStackSkeleton />
            ) : feedError ? (
              <div role="alert" className={stateCard}>
                 <span className="size-16 rounded-full bg-rosa flex items-center justify-center text-viola mx-auto mb-6">
                    <AlertTriangle size={28} strokeWidth={1.75} />
                 </span>
                 <h2 className="text-title text-viola mb-3">Feed non disponibile</h2>
                 <p className="text-body text-viola-500 mb-8">{feedError}</p>
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   {feedError === "Profilo non trovato" && (
                     <Link
                       href="/onboarding"
                       className={cn(buttonVariants(), "h-12 px-8 text-base w-full sm:w-auto")}
                     >
                       Completa il profilo
                     </Link>
                   )}
                   {refreshButton("Riprova")}
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
              <div className={stateCard}>
                 <LogoMark className="size-16 mx-auto mb-6" />
                 <h2 className="text-title text-viola mb-3">Ottimo lavoro!</h2>
                 <p className="text-body text-viola-500 mb-8">Hai visualizzato tutti i profili disponibili per oggi. Torna più tardi per nuove scoperte.</p>
                 {refreshButton("Aggiorna il feed")}
              </div>
            )}
          </div>
        </section>
      </PageBody>
    </div>
  );
}
