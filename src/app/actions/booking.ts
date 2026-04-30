"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { matches, proposedSlots } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { BookingEmail } from "@/emails/BookingEmail";
import { ConfirmationEmail } from "@/emails/ConfirmationEmail";
import { createMeetEvent, deleteMeetEvent } from "@/lib/google-calendar";
import { generateIcsString } from "@/lib/calendar-utils";

export async function proposeSlots(matchId: string, slots: { startTime: Date, endTime: Date }[], meetingLink?: string) {
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

    const profName = `${match.professional.professionalProfile?.firstName || ''} ${match.professional.professionalProfile?.lastName || ''}`.trim() || match.professional.name || "Professionista";
    const compName = match.company.companyProfile?.companyName || match.company.name || "Azienda";

    let finalMeetingLink = meetingLink || null;
    let googleEventId = null;

    // Generate Meet link immediately if no custom link provided
    if (!meetingLink && slots.length > 0) {
      const calendarResult = await createMeetEvent(
        `Colloquio Skillr (Proposto): ${profName} / ${compName}`,
        `Colloquio conoscitivo proposto tramite Skillr.\nQuesto link è valido per tutti gli slot proposti.`,
        slots[0].startTime,
        slots[0].endTime,
        [match.professional.email, match.company.email]
      );
      
      if (calendarResult.success) {
        finalMeetingLink = calendarResult.meetingLink || null;
        googleEventId = calendarResult.eventId || null;
      }
    }

    await db.transaction(async (tx) => {
      // 1. Clear existing slots
      await tx.delete(proposedSlots).where(eq(proposedSlots.matchId, matchId));

      // 2. Insert new slots
      await tx.insert(proposedSlots).values(
        slots.map(s => ({
          matchId,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );

      // 3. If there was a previous Google event, delete it
      if (match.googleEventId) {
        await deleteMeetEvent(match.googleEventId);
      }

      // 4. Update match meeting link
      await tx.update(matches)
        .set({ 
          meetingLink: finalMeetingLink,
          googleEventId: googleEventId,
          scheduledAt: null, // Reset scheduled date since we are proposing new slots
          updatedAt: new Date()
        })
        .where(eq(matches.id, matchId));
    });

    // Send Booking Email to professional
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

    const profName = `${slot.match.professional.professionalProfile?.firstName || ''} ${slot.match.professional.professionalProfile?.lastName || ''}`.trim() || slot.match.professional.name || "Professionista";
    const compName = slot.match.company.companyProfile?.companyName || slot.match.company.name || "Azienda";

    // 1. Determine Meeting Method
    let meetingLink = slot.match.meetingLink;
    let googleEventId = slot.match.googleEventId;

    // If we have a Google Event ID, we should technically update it. 
    // But since createMeetEvent creates a new one, we'll just delete the old one and create new to keep it simple and ensure correct time.
    if (googleEventId) {
      await deleteMeetEvent(googleEventId);
      googleEventId = null;
    }

    // Re-generate or create the event for the final time
    const calendarResult = await createMeetEvent(
      `Colloquio Skillr: ${profName} / ${compName}`,
      `Colloquio conoscitivo pianificato tramite Skillr.\nPartecipanti: ${profName}, ${compName}`,
      slot.startTime,
      slot.endTime,
      [slot.match.professional.email, slot.match.company.email]
    );
    
    if (calendarResult.success) {
      meetingLink = calendarResult.meetingLink || meetingLink;
      googleEventId = calendarResult.eventId || null;
    }

    // 2. Update slot and match
    await db.transaction(async (tx) => {
      await tx.update(proposedSlots)
        .set({ isAccepted: true })
        .where(eq(proposedSlots.id, slotId));

      await tx.update(matches)
        .set({ 
          scheduledAt: slot.startTime,
          meetingLink,
          googleEventId,
          updatedAt: new Date()
        })
        .where(eq(matches.id, slot.match.id));
    });

    // 3. Send Confirmation Emails
    const startTimeFormatted = slot.startTime.toLocaleString('it-IT', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const icsContent = generateIcsString({
      title: `Colloquio Skillr: ${profName} / ${compName}`,
      description: `Colloquio conoscitivo pianificato tramite Skillr.\nLink Meet: ${meetingLink || 'Non disponibile'}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      location: meetingLink || "Google Meet",
      uid: slot.match.id
    });

    const attachments = [{
      filename: 'invito-colloquio.ics',
      content: Buffer.from(icsContent)
    }];

    await Promise.all([
      sendEmail({
        to: slot.match.professional.email,
        subject: "Colloquio confermato!",
        react: ConfirmationEmail({
          userName: profName,
          otherPartyName: compName,
          startTime: startTimeFormatted,
          meetingLink: meetingLink || undefined
        }),
        attachments
      }),
      sendEmail({
        to: slot.match.company.email,
        subject: "Colloquio confermato!",
        react: ConfirmationEmail({
          userName: compName,
          otherPartyName: profName,
          startTime: startTimeFormatted,
          meetingLink: meetingLink || undefined
        }),
        attachments
      })
    ]);

    revalidatePath(`/matches/${slot.match.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error confirming slot:", error);
    return { error: "Errore durante la conferma" };
  }
}
