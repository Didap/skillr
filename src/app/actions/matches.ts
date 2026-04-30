"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles, matches } from "@/db/schema";
import { eq, ne, and, notInArray, desc } from "drizzle-orm";
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
        where: and(
          eq(matches.companyId, userId),
          ne(matches.companyStatus, 'pending')
        ),
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
          type: "professional" as const
        }))
      };

    } else if (role === "professional") {
      const swiped = await db.query.matches.findMany({
        where: and(
          eq(matches.professionalId, userId),
          ne(matches.professionalStatus, 'pending')
        ),
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
          type: "company" as const
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
      },
    });

    if (!match) return { error: "Match non trovato" };

    // Check authorization: must be either the professional or the company
    if (match.professionalId !== session.user.id && match.companyId !== session.user.id) {
      return { error: "Non autorizzato a vedere questo match" };
    }

    const isCompanyView = session.user.role === 'company';
    const targetUser = isCompanyView ? match.professional : match.company;
    const targetProfile = isCompanyView ? match.professional?.professionalProfile : match.company?.companyProfile;

    return {
      success: true,
      data: {
        ...match,
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
      }
    };
  } catch (error) {
    console.error("Error fetching match detail:", error);
    return { error: "Errore durante il caricamento del dettaglio" };
  }
}
