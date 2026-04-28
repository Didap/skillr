"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles, matches, jobs } from "@/db/schema";
import { eq, ne, and, or, notInArray, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
          targetName = (targetProfile as any)?.firstName 
            ? `${(targetProfile as any).firstName} ${(targetProfile as any).lastName}` 
            : targetUser?.name || "Professionista";
        } else {
          targetName = (targetProfile as any)?.companyName || targetUser?.name || "Azienda";
        }

        return {
          id: m.id,
          matchedAt: m.matchedAt,
          targetName,
          targetTitle: isCompanyView ? (targetProfile as any)?.title : (m.job?.title || "Opportunità IT"),
          targetImage: (targetProfile as any)?.photoUrl || (targetProfile as any)?.logoUrl || targetUser?.image,
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
      const swiped = await db.query.matches.findMany({
        where: eq(matches.companyId, userId),
        columns: { professionalId: true }
      });
      const swipedIds = swiped.map(m => m.professionalId);

      const professionals = await db.query.professionalProfiles.findMany({
        where: swipedIds.length > 0 ? notInArray(professionalProfiles.userId, swipedIds) : undefined,
        with: { user: true },
        limit: 20,
      });

      return { 
        success: true, 
        data: professionals.map(p => ({
          id: p.userId,
          name: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.user.name || "Utente",
          title: p.title || "Professionista",
          rate: `€${p.rateAmountEur}/${p.rateType === 'daily' ? 'giorno' : p.rateType === 'hourly' ? 'ora' : 'anno'}`,
          location: p.city || "Remote",
          skills: p.topSkills || [],
          image: p.photoUrl || p.user.image,
          bioShort: p.bioShort || "",
          type: "professional"
        }))
      };

    } else if (role === "professional") {
      const swiped = await db.query.matches.findMany({
        where: eq(matches.professionalId, userId),
        columns: { companyId: true }
      });
      const swipedIds = swiped.map(m => m.companyId);

      const companies = await db.query.companyProfiles.findMany({
        where: swipedIds.length > 0 ? notInArray(companyProfiles.userId, swipedIds) : undefined,
        with: { user: true },
        limit: 20,
      });

      return {
        success: true,
        data: companies.map(c => ({
          id: c.userId,
          name: c.companyName || c.user.name || "Azienda",
          title: "Azienda IT",
          rate: "Trasparente",
          location: c.city || "Remote",
          skills: ["Software Development"],
          image: c.logoUrl || c.user.image,
          type: "company"
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
