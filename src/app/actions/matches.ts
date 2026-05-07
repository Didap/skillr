"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, matches, jobs, jobApplications } from "@/db/schema";
import { eq, and, notInArray, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { MatchEmail } from "@/emails/MatchEmail";

export async function getMatches() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  const userId = session.user.id;
  const role = session.user.role;

  try {
    const userMatches = await db.query.matches.findMany({
      where: role === 'company' 
        ? and(eq(matches.companyId, userId), eq(matches.professionalStatus, 'liked'), eq(matches.companyStatus, 'liked'))
        : and(eq(matches.professionalId, userId), eq(matches.professionalStatus, 'liked'), eq(matches.companyStatus, 'liked')),
      with: {
        professional: { 
          with: { professionalProfile: true } 
        },
        company: { 
          with: { companyProfile: true } 
        },
        job: true,
      },
      orderBy: [desc(matches.matchedAt)],
    });

    return {
      success: true,
      data: userMatches.map(m => {
        const isCompanyView = role === 'company';
        const targetUser = isCompanyView ? m.professional : m.company;
        const targetProfile = isCompanyView ? m.professional?.professionalProfile : m.company?.companyProfile;
        
        let targetName = "";
        if (isCompanyView) {
          targetName = m.professional?.professionalProfile?.firstName 
            ? `${m.professional.professionalProfile.firstName} ${m.professional.professionalProfile.lastName}` 
            : targetUser?.name || "Professionista";
        } else {
          targetName = m.company?.companyProfile?.companyName || targetUser?.name || "Azienda";
        }

        return {
          id: m.id,
          matchedAt: m.matchedAt,
          targetName,
          targetTitle: isCompanyView ? (m.professional?.professionalProfile?.title) : (m.job?.title || "Opportunità IT"),
          targetImage: isCompanyView 
            ? (m.professional?.professionalProfile?.photoUrl || m.professional?.image)
            : (m.company?.companyProfile?.logoUrl || m.company?.image),
          targetRating: targetProfile?.averageRating || "0.0",
          targetReviewCount: targetProfile?.reviewCount || 0,
          status: "Match confermato",
        };
      })
    };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { error: "Errore durante il caricamento dei match" };
  }
}

export async function getPotentialMatches() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { error: "Non autorizzato" };
  }

  const userId = session.user.id;
  const role = session.user.role;

  try {
    if (role === "company") {
      // Get IDs of professionals already interacted with
      const interacted = await db.query.matches.findMany({
        where: eq(matches.companyId, userId),
        columns: { professionalId: true }
      });
      const excludedIds = interacted.map(i => i.professionalId);

      // Fetch random professionals
      const potentialProfessionals = await db.query.professionalProfiles.findMany({
        where: excludedIds.length > 0 ? notInArray(professionalProfiles.userId, excludedIds) : undefined,
        with: {
          user: true
        },
        limit: 20,
      });

      return {
        success: true,
        data: potentialProfessionals.map(p => ({
          id: p.userId,
          name: p.firstName ? `${p.firstName} ${p.lastName}` : p.user?.name || "Professionista",
          title: p.title || "Esperto IT",
          rate: p.rateAmountEur ? `€${p.rateAmountEur}/${p.rateType === 'ral_annual' ? 'anno' : p.rateType === 'daily' ? 'gg' : 'ora'}` : "Tariffa non indicata",
          location: p.city || "Remote",
          skills: p.topSkills || [],
          image: p.photoUrl || p.user?.image,
          bioShort: p.bioShort || "",
          type: "professional" as const,
          rating: p.averageRating || "0.0",
        }))
      };

    } else if (role === "professional") {
      // Get professional profile to filter by skills
      const profile = await db.query.professionalProfiles.findFirst({
        where: eq(professionalProfiles.userId, userId),
      });

      if (!profile) return { error: "Profilo non trovato" };

      const userSkills = [
        ...(profile.topSkills || []),
        ...(profile.secondarySkills || [])
      ];

      // Get IDs of jobs already applied to or skipped (skipped logic not fully implemented yet, but excluding applied)
      const applied = await db.query.jobApplications.findMany({
        where: eq(jobApplications.professionalId, userId),
        columns: { jobId: true }
      });
      const excludedJobIds = applied.map(a => a.jobId);

      // Fetch jobs matching skills
      const potentialJobs = await db.query.jobs.findMany({
        where: and(
          eq(jobs.isActive, true),
          excludedJobIds.length > 0 ? notInArray(jobs.id, excludedJobIds) : undefined,
          userSkills.length > 0 
            ? sql`${jobs.skills} && ARRAY[${sql.join(userSkills.map(s => sql`${s}`), sql`, `)}]::text[]` 
            : undefined
        ),
        with: {
          company: {
            with: { companyProfile: true }
          }
        },
        limit: 20,
      });

      return {
        success: true,
        data: potentialJobs.map(j => ({
          id: j.id,
          name: j.title,
          title: j.company?.companyProfile?.companyName || "Azienda IT",
          rate: j.rateType === 'ral_annual' 
            ? `€${j.budgetMinEur}-${j.budgetMaxEur} RAL` 
            : `€${j.budgetMinEur}-${j.budgetMaxEur}/${j.rateType === 'daily' ? 'gg' : 'ora'}`,
          location: j.location || "Remote",
          skills: j.skills || [],
          image: j.company?.companyProfile?.logoUrl || j.company?.image,
          bioShort: j.description || "",
          type: "job" as const,
          jobId: j.id,
          remoteOk: j.remoteOk || false,
        }))
      };
    }
    return { error: "Ruolo non valido" };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { error: "Errore durante il caricamento" };
  }
}

export async function recordSwipe(targetId: string, targetType: "professional" | "company", direction: "left" | "right") {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return { error: "Non autorizzato" };

  const userId = session.user.id;
  const role = session.user.role;
  const status = direction === "right" ? "liked" : "passed";

  try {
    const filter = role === 'company' 
      ? and(eq(matches.companyId, userId), eq(matches.professionalId, targetId))
      : and(eq(matches.professionalId, userId), eq(matches.companyId, targetId));
    
    const existingMatch = await db.query.matches.findFirst({ where: filter });

    if (existingMatch) {
      const updates = role === 'company' 
        ? { companyStatus: status as "liked" | "passed" } 
        : { professionalStatus: status as "liked" | "passed" };
        
      const isMatch = (status === 'liked' && (role === 'company' ? existingMatch.professionalStatus === 'liked' : existingMatch.companyStatus === 'liked'));
      
      await db.update(matches)
        .set({ ...updates, matchedAt: isMatch ? new Date() : existingMatch.matchedAt })
        .where(eq(matches.id, existingMatch.id));
      
      if (isMatch) {
        // Send Match Emails
        try {
          const [user, target] = await Promise.all([
            db.query.users.findFirst({
              where: eq(users.id, userId),
              with: { professionalProfile: true, companyProfile: true }
            }),
            db.query.users.findFirst({
              where: eq(users.id, targetId),
              with: { professionalProfile: true, companyProfile: true }
            })
          ]);

          if (user && target) {
            const userName = (user.role === 'company' ? user.companyProfile?.companyName : `${user.professionalProfile?.firstName || ''} ${user.professionalProfile?.lastName || ''}`.trim()) || user.name || "Utente";
            const targetName = (target.role === 'company' ? target.companyProfile?.companyName : `${target.professionalProfile?.firstName || ''} ${target.professionalProfile?.lastName || ''}`.trim()) || target.name || "Utente";
            
            const userImage = user.role === 'company' ? user.companyProfile?.logoUrl : user.professionalProfile?.photoUrl;
            const targetImage = target.role === 'company' ? target.companyProfile?.logoUrl : target.professionalProfile?.photoUrl;

            const matchUrl = `${process.env.NEXTAUTH_URL}/matches/${existingMatch.id}`;

            await Promise.all([
              sendEmail({
                to: user.email,
                subject: "Nuovo Match su Skillr!",
                react: MatchEmail({
                  userName,
                  matchedName: targetName,
                  matchedImage: targetImage || undefined,
                  role: user.role as 'professional' | 'company',
                  matchUrl
                })
              }),
              sendEmail({
                to: target.email,
                subject: "Nuovo Match su Skillr!",
                react: MatchEmail({
                  userName: targetName,
                  matchedName: userName,
                  matchedImage: userImage || undefined,
                  role: target.role as 'professional' | 'company',
                  matchUrl
                })
              })
            ]);
          }
        } catch (emailError) {
          console.error("Error sending match emails:", emailError);
        }
      }
      
      revalidatePath("/dashboard");
      revalidatePath("/matches");
      return { success: true, isMatch, matchId: existingMatch.id };
    } else {
      const newMatch = await db.insert(matches).values({
        companyId: role === 'company' ? userId : targetId,
        professionalId: role === 'professional' ? userId : targetId,
        companyStatus: role === 'company' ? status as "liked" | "passed" : 'pending',
        professionalStatus: role === 'professional' ? status as "liked" | "passed" : 'pending',
      }).returning({ id: matches.id });
      
      return { success: true, isMatch: false, matchId: newMatch[0].id };
    }
  } catch (error) {
    console.error("Error recording swipe:", error);
    return { error: "Errore salvataggio" };
  }
}

export async function getMatchDetail(matchId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        professional: { with: { professionalProfile: true } },
        company: { with: { companyProfile: true } },
        job: true,
        proposedSlots: true,
        reviews: true,
      },
    });

    if (!match) return { error: "Match non trovato" };

    // Check authorization: must be either the professional or the company
    if (match.professionalId !== session.user.id && match.companyId !== session.user.id) {
      return { error: "Non autorizzato a vedere questo match" };
    }

    const isCompanyView = session.user.role === 'company';
    const targetUser = isCompanyView ? match.professional : match.company;

    const hasReviewed = match.reviews.some(r => r.authorId === session.user.id);

    return {
      success: true,
      data: {
        ...match,
        targetId: targetUser?.id,
        targetName: (isCompanyView 
          ? `${match.professional?.professionalProfile?.firstName || ''} ${match.professional?.professionalProfile?.lastName || ''}`.trim() 
          : match.company?.companyProfile?.companyName) || targetUser?.name || "Utente",
        targetTitle: isCompanyView ? match.professional?.professionalProfile?.title : (match.job?.title || "Opportunità IT"),
        targetImage: isCompanyView 
          ? (match.professional?.professionalProfile?.photoUrl || match.professional?.image)
          : (match.company?.companyProfile?.logoUrl || match.company?.image),
        targetEmail: targetUser?.email,
        targetBio: isCompanyView 
          ? (match.professional?.professionalProfile?.bioShort || "")
          : (match.company?.companyProfile?.description || ""),
        targetSkills: isCompanyView ? (match.professional?.professionalProfile?.topSkills || []) : [],
        targetRate: isCompanyView 
          ? (match.professional?.professionalProfile?.rateAmountEur 
              ? `€${match.professional.professionalProfile.rateAmountEur}/${match.professional.professionalProfile.rateType === 'ral_annual' ? 'RAL' : match.professional.professionalProfile.rateType === 'daily' ? 'gg' : 'ora'}`
              : null)
          : (match.job?.budgetMinEur 
              ? `€${match.job.budgetMinEur}-${match.job.budgetMaxEur} ${match.job.rateType === 'ral_annual' ? 'RAL' : match.job.rateType === 'daily' ? '/gg' : '/ora'}`
              : null),
        hasReviewed,
      }
    };
  } catch (error) {
    console.error("Error fetching match detail:", error);
    return { error: "Errore durante il caricamento del dettaglio" };
  }
}
