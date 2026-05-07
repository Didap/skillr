import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles, jobs, matches, reviews } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/profile/ProfessionalProfileView";
import { CompanyProfileView } from "@/components/profile/CompanyProfileView";
import { Button } from "@/components/ui/button";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  // Fetch the user and basic profile data
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      professionalProfile: true,
      companyProfile: true,
    }
  });

  if (!user) {
    return notFound();
  }

  // Fetch reviews separately to avoid complex join issues
  const receivedReviews = await db.query.reviews.findMany({
    where: eq(reviews.targetId, id),
    with: {
      author: true
    },
    orderBy: [desc(reviews.createdAt)]
  });

  // If it's a company, we also need their active jobs
  let activeJobs: any[] = [];
  if (user.role === "company") {
    activeJobs = await db.query.jobs.findMany({
      where: eq(jobs.companyId, id),
      orderBy: [desc(jobs.createdAt)],
    });
  }

  // Check if there's a match between the viewer and this profile
  let matchId: string | null = null;
  if (session?.user?.id && session.user.id !== id) {
    const existingMatch = await db.query.matches.findFirst({
      where: session.user.role === 'company'
        ? and(eq(matches.companyId, session.user.id), eq(matches.professionalId, id))
        : and(eq(matches.professionalId, session.user.id), eq(matches.companyId, id))
    });
    if (existingMatch?.companyStatus === 'liked' && existingMatch?.professionalStatus === 'liked') {
      matchId = existingMatch.id;
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div>
           <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Profilo</h1>
           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Dettagli Utente</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Sidebar handles navigation now */}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="pb-24 px-6 md:px-10 lg:px-20 py-10 max-w-7xl mx-auto w-full">
          {user.role === "professional" && user.professionalProfile ? (
            <ProfessionalProfileView 
              profile={user.professionalProfile} 
              reviews={receivedReviews}
              matchId={matchId}
              professionalId={id}
              viewerRole={session?.user?.role as any}
            />
          ) : user.role === "company" && user.companyProfile ? (
            <CompanyProfileView 
              profile={user.companyProfile}
              jobs={activeJobs}
              reviews={receivedReviews}
            />
          ) : (
            <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-premium px-8">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <span className="text-4xl text-slate-300">?</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-950 mb-4 tracking-tight">Profilo in allestimento</h1>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                L&apos;utente non ha ancora completato la configurazione del suo profilo pubblico. 
                Torna a trovarci tra poco!
              </p>
              <Link href="/dashboard" className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-slate-950 text-white font-bold hover:bg-emerald-600 transition-colors">
                Torna alla Dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
