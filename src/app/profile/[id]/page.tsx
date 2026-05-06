import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles, jobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/profile/ProfessionalProfileView";
import { CompanyProfileView } from "@/components/profile/CompanyProfileView";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  // Fetch the user with all related data in a single structured query
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      professionalProfile: true,
      companyProfile: true,
      receivedReviews: {
        with: {
          author: true
        },
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)]
      }
    }
  });

  if (!user) {
    return notFound();
  }

  // If it's a company, we also need their active jobs
  let activeJobs: any[] = [];
  if (user.role === "company") {
    activeJobs = await db.query.jobs.findMany({
      where: eq(jobs.companyId, id),
      orderBy: [desc(jobs.createdAt)],
    });
  }

  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 text-slate-500 hover:text-slate-950 transition-all font-bold text-sm group"
        >
          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Dashboard
        </Link>
        <Link href="/" className="font-display text-2xl italic font-bold text-slate-950">
          Skillr
        </Link>
        <div className="w-24 hidden md:block" /> {/* Spacer */}
      </nav>

      <main className="pt-32 pb-24 px-6">
        {user.role === "professional" && user.professionalProfile ? (
          <ProfessionalProfileView 
            profile={user.professionalProfile} 
            reviews={user.receivedReviews}
          />
        ) : user.role === "company" && user.companyProfile ? (
          <CompanyProfileView 
            profile={user.companyProfile}
            jobs={activeJobs}
            reviews={user.receivedReviews}
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
  );
}
