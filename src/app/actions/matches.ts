"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles, matches, jobs } from "@/db/schema";
import { eq, ne, and, or, notInArray, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { MatchEmail } from "@/emails/MatchEmail";
import { BookingEmail } from "@/emails/BookingEmail";
import { ConfirmationEmail } from "@/emails/ConfirmationEmail";
import { proposedSlots } from "@/db/schema";

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

export async function proposeSlots(matchId: string, slots: { startTime: Date, endTime: Date }[]) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') return { error: "Non autorizzato" };

  try {
    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.companyId, session.user.id)),
      with: { 
        professional: { with: { professionalProfile: true } },
        company: { with: { companyProfile: true } }
      }
    });

    if (!match) return { error: "Match non trovato" };

    // Insert slots
    await db.insert(proposedSlots).values(
      slots.map(s => ({
        matchId,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    );

    // Send Booking Email to professional
    const profName = `${match.professional.professionalProfile?.firstName || ''} ${match.professional.professionalProfile?.lastName || ''}`.trim() || match.professional.name || "Professionista";
    const compName = match.company.companyProfile?.companyName || match.company.name || "Azienda";
    
    await sendEmail({
      to: match.professional.email,
      subject: `Proposta colloquio da ${compName}`,
      react: BookingEmail({
        userName: profName,
        companyName: compName,
        companyLogo: match.company.companyProfile?.logoUrl || undefined,
        bookingUrl: `${process.env.NEXTAUTH_URL}/matches/${matchId}`,
      })
    });

    revalidatePath(`/matches/${matchId}`);
    return { success: true };
  } catch (error) {
    console.error("Error proposing slots:", error);
    return { error: "Errore durante l'invio della proposta" };
  }
}

export async function confirmSlot(slotId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'professional') return { error: "Non autorizzato" };

  try {
    const slot = await db.query.proposedSlots.findFirst({
      where: eq(proposedSlots.id, slotId),
      with: {
        match: {
          with: {
            professional: { with: { professionalProfile: true } },
            company: { with: { companyProfile: true } }
          }
        }
      }
    });

    if (!slot || slot.match.professionalId !== session.user.id) {
      return { error: "Slot non trovato o non autorizzato" };
    }

    // Update slot
    await db.update(proposedSlots)
      .set({ isAccepted: true })
      .where(eq(proposedSlots.id, slotId));

    // Send Confirmation Emails to both
    const profName = `${slot.match.professional.professionalProfile?.firstName || ''} ${slot.match.professional.professionalProfile?.lastName || ''}`.trim() || slot.match.professional.name || "Professionista";
    const compName = slot.match.company.companyProfile?.companyName || slot.match.company.name || "Azienda";
    const startTimeFormatted = slot.startTime.toLocaleString('it-IT', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    // Generate ICS content
    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Skillr//NONSGML Event//EN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(slot.startTime)}
DTEND:${formatICSDate(slot.endTime)}
SUMMARY:Colloquio Skillr: ${profName} / ${compName}
DESCRIPTION:Colloquio conoscitivo su Skillr tra ${profName} e ${compName}.
END:VEVENT
END:VCALENDAR`;

    await Promise.all([
      sendEmail({
        to: slot.match.professional.email,
        subject: "Colloquio confermato!",
        react: ConfirmationEmail({
          userName: profName,
          otherPartyName: compName,
          startTime: startTimeFormatted,
        }),
        attachments: [
          {
            filename: 'invito.ics',
            content: Buffer.from(icsContent).toString('base64'),
          }
        ]
      }),
      sendEmail({
        to: slot.match.company.email,
        subject: "Colloquio confermato!",
        react: ConfirmationEmail({
          userName: compName,
          otherPartyName: profName,
          startTime: startTimeFormatted,
        }),
        attachments: [
          {
            filename: 'invito.ics',
            content: Buffer.from(icsContent).toString('base64'),
          }
        ]
      })
    ]);

    revalidatePath(`/matches/${slot.match.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error confirming slot:", error);
    return { error: "Errore durante la conferma" };
  }
}
