import { auth } from "@/auth";
import { db } from "@/db";
import { users, jobs, matches, reviews } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/profile/ProfessionalProfileView";
import { CompanyProfileView } from "@/components/profile/CompanyProfileView";
import { publicUserColumns } from "@/db/safe-columns";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  // Fetch the user and basic profile data
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: publicUserColumns,
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
      author: { columns: { name: true, image: true } }
    },
    orderBy: [desc(reviews.createdAt)]
  });

  // If it's a company, we also need their active jobs
  let activeJobs: (typeof jobs.$inferSelect)[] = [];
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

  const headerTitle =
    user.role === "professional" && user.professionalProfile
      ? `${user.professionalProfile.firstName ?? ""} ${user.professionalProfile.lastName ?? ""}`.trim() || "Profilo"
      : user.role === "company" && user.companyProfile
        ? user.companyProfile.companyName || "Profilo"
        : "Profilo";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <PageHeader title={headerTitle} subtitle="Dettagli Utente" />

      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
        <main className="px-4 md:px-10 lg:px-20 pt-6 md:pt-10 max-w-7xl mx-auto w-full">
          {/* Tab bar clearance on phones; the desktop keeps its roomy bottom margin */}
          <div className="pb-tabbar">
            <div className="md:pb-24">
              {user.role === "professional" && user.professionalProfile ? (
                <ProfessionalProfileView
                  profile={user.professionalProfile}
                  reviews={receivedReviews}
                  matchId={matchId}
                  professionalId={id}
                  viewerRole={session?.user?.role as "professional" | "company" | null}
                />
              ) : user.role === "company" && user.companyProfile ? (
                <CompanyProfileView
                  profile={user.companyProfile}
                  jobs={activeJobs}
                  reviews={receivedReviews}
                />
              ) : (
                <div className="max-w-xl mx-auto text-center py-12 md:py-20 bg-white rounded-[2rem] md:rounded-[3rem] border border-viola-100 shadow-premium px-6 md:px-8 mb-8">
                  <div className="w-20 h-20 bg-viola-50 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8">
                    <span className="text-4xl text-viola-300">?</span>
                  </div>
                  <h2 className="text-3xl font-display font-bold text-viola-950 mb-4 tracking-tight">Profilo in allestimento</h2>
                  <p className="text-viola-500 font-medium leading-relaxed mb-8">
                    L&apos;utente non ha ancora completato la configurazione del suo profilo pubblico.
                    Torna a trovarci tra poco!
                  </p>
                  <Link href="/dashboard" className="pressable inline-flex items-center justify-center h-12 px-8 rounded-xl bg-viola-950 text-white font-bold hover:bg-rosso-600 transition-colors">
                    Torna alla Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
