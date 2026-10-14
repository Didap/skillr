"use server";

import { db } from "@/db";
import { matches, proposedSlots } from "@/db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail, sendInBackground } from "@/lib/mail";
import { BookingEmail } from "@/emails/BookingEmail";
import { ConfirmationEmail } from "@/emails/ConfirmationEmail";
import { createMeetEvent, deleteMeetEvent, isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { generateIcsString, CALL_DURATION_MINUTES, CALL_DURATION_MS, smartEventEnd } from "@/lib/calendar-utils";
import { formatRomeDate, normalizeMeetingUrl } from "@/lib/rome-time";
import { companyWithProfile, professionalWithProfile } from "@/db/safe-columns";
import { requireUser } from "@/lib/auth-guard";
import { appUrl } from "@/lib/app-url";
import { companyDisplayName, professionalDisplayName } from "@/lib/display-name";

// Both sides of a match, with the profiles that hold their display names.
const matchParties = { professional: professionalWithProfile, company: companyWithProfile } as const;

// Clock skew tolerated between the browser that built the slot and the server.
const CLOCK_SKEW_MS = 60_000;
const MAX_SLOTS = 3;

class BookingConflictError extends Error {}

export async function proposeSlots(matchId: string, slots: { startTime: Date, endTime: Date }[], meetingLink?: string) {
  const user = await requireUser("company");
  if ("error" in user) return { error: user.error };

  // 1. Validate the slots: 1..3, in the future, 30 minutes each, no duplicates
  if (!Array.isArray(slots) || slots.length === 0) return { error: "Proponi almeno uno slot" };
  if (slots.length > MAX_SLOTS) return { error: `Puoi proporre al massimo ${MAX_SLOTS} slot` };

  const now = Date.now();
  const normalizedSlots = slots.map(s => ({ startTime: new Date(s.startTime), endTime: new Date(s.endTime) }));
  for (const s of normalizedSlots) {
    if (isNaN(s.startTime.getTime()) || isNaN(s.endTime.getTime())) return { error: "Orario non valido" };
    if (s.startTime.getTime() <= now - CLOCK_SKEW_MS) return { error: "Non puoi proporre un orario già passato" };
    if (s.endTime.getTime() - s.startTime.getTime() !== CALL_DURATION_MS) {
      return { error: `Ogni slot deve durare ${CALL_DURATION_MINUTES} minuti` };
    }
  }
  if (new Set(normalizedSlots.map(s => s.startTime.getTime())).size !== normalizedSlots.length) {
    return { error: "Hai proposto due volte lo stesso orario" };
  }

  // 2. Meeting method: an external link must be an absolute http(s) URL; Google Meet
  // needs the service account, otherwise we would save a proposal that never gets a link.
  let customLink: string | null = null;
  if (meetingLink !== undefined) {
    customLink = normalizeMeetingUrl(meetingLink);
    if (!customLink) return { error: "Inserisci un link valido per la chiamata (es. https://zoom.us/j/...)" };
  } else if (!isGoogleCalendarConfigured()) {
    return { error: "Google Meet non è disponibile al momento. Scegli \"Link Esterno\" e incolla un link Zoom, Teams o simile." };
  }

  try {
    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.companyId, user.id)),
      with: matchParties,
    });

    if (!match) return { error: "Match non trovato" };
    if (match.companyStatus !== 'liked' || match.professionalStatus !== 'liked') return { error: "Il match non è ancora reciproco" };
    if (match.scheduledAt) return { error: "L'incontro è già stato confermato" };

    const profName = professionalDisplayName(match.professional);
    const compName = companyDisplayName(match.company);

    // The Meet event is created only when the professional confirms a slot (confirmSlot):
    // here we just store the slots, plus the link when the company brought its own.
    await db.transaction(async (tx) => {
      // Locks the match row and loses cleanly if the professional confirmed meanwhile.
      const updated = await tx.update(matches)
        .set({
          meetingLink: customLink,
          googleEventId: null,
          updatedAt: new Date()
        })
        .where(and(eq(matches.id, matchId), isNull(matches.scheduledAt)))
        .returning({ id: matches.id });
      if (updated.length === 0) throw new BookingConflictError();

      await tx.delete(proposedSlots).where(eq(proposedSlots.matchId, matchId));
      await tx.insert(proposedSlots).values(
        normalizedSlots.map(s => ({
          matchId,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );
    });

    // After the response: drop the Meet event created at proposal time by the previous flow
    // (no longer valid) and send the Booking Email to the professional.
    const previousEventId = match.googleEventId;
    if (previousEventId) {
      sendInBackground(`old Meet event cleanup, match ${matchId}`, [() => deleteMeetEvent(previousEventId)]);
    }
    sendInBackground(`slot proposal, match ${matchId}`, [
      () => sendEmail({
        to: match.professional.email,
        subject: `Proposta colloquio da ${compName}`,
        react: BookingEmail({
          userName: profName,
          companyName: compName,
          companyLogo: match.company.companyProfile?.logoUrl || undefined,
          bookingUrl: appUrl(`/matches/${matchId}`),
        })
      }),
    ]);

    revalidatePath(`/matches/${matchId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof BookingConflictError) return { error: "L'incontro è già stato confermato" };
    console.error("Error proposing slots:", error);
    return { error: "Errore durante l'invio della proposta" };
  }
}

export async function confirmSlot(slotId: string) {
  const user = await requireUser("professional");
  if ("error" in user) return { error: user.error };

  try {
    const slot = await db.query.proposedSlots.findFirst({
      where: eq(proposedSlots.id, slotId),
      with: {
        match: {
          with: { ...matchParties, proposedSlots: true },
        }
      }
    });

    if (!slot || slot.match.professionalId !== user.id) {
      return { error: "Slot non trovato o non autorizzato" };
    }
    if (slot.match.scheduledAt || slot.match.proposedSlots.some(s => s.isAccepted)) {
      return { error: "Hai già confermato un orario per questo incontro" };
    }
    if (slot.startTime.getTime() <= Date.now()) {
      return { error: "Questo orario è già passato. Scegline un altro o attendi una nuova proposta." };
    }

    const profName = professionalDisplayName(slot.match.professional);
    const compName = companyDisplayName(slot.match.company);

    // 1. Determine Meeting Method. No stored link means the company chose Google Meet;
    // a stored googleEventId comes from the old flow that created the event at proposal time.
    const previousEventId = slot.match.googleEventId;
    const usesGoogleMeet = !slot.match.meetingLink || !!previousEventId;
    let meetingLink = slot.match.meetingLink;
    let googleEventId: string | null = null;

    // The Meet event is created before confirming: if Google fails the slot stays open and the
    // professional can retry, so nobody ends up with a confirmed call and a missing or stale link.
    if (usesGoogleMeet) {
      const calendarResult = await createMeetEvent(
        `Colloquio Helllo: ${profName} / ${compName}`,
        `Colloquio conoscitivo pianificato tramite Helllo.\nPartecipanti: ${profName}, ${compName}`,
        slot.startTime,
        slot.endTime,
        [slot.match.professional.email, slot.match.company.email]
      );

      if (!calendarResult.success) {
        console.error(`[confirmSlot] Failed to generate Meet link for match ${slot.match.id}:`, calendarResult.error);
        return { error: "Non siamo riusciti a generare il link Google Meet. Riprova tra qualche minuto: l'orario non è ancora confermato." };
      }
      meetingLink = calendarResult.meetingLink;
      googleEventId = calendarResult.eventId;
    }

    // 2. Update slot and match atomically: only the first confirmation wins
    try {
      await db.transaction(async (tx) => {
        const updatedMatch = await tx.update(matches)
          .set({
            scheduledAt: slot.startTime,
            meetingLink,
            googleEventId,
            updatedAt: new Date()
          })
          .where(and(eq(matches.id, slot.match.id), isNull(matches.scheduledAt)))
          .returning({ id: matches.id });
        if (updatedMatch.length === 0) throw new BookingConflictError();

        // The company may have replaced the proposal in the meantime.
        const updatedSlot = await tx.update(proposedSlots)
          .set({ isAccepted: true })
          .where(and(eq(proposedSlots.id, slotId), eq(proposedSlots.matchId, slot.match.id)))
          .returning({ id: proposedSlots.id });
        if (updatedSlot.length === 0) throw new BookingConflictError();
      });
    } catch (error) {
      // The event we just created belongs to a confirmation that did not happen.
      if (googleEventId) await deleteMeetEvent(googleEventId);
      if (error instanceof BookingConflictError) {
        return { error: "L'incontro è già stato confermato o la proposta è cambiata. Ricarica la pagina." };
      }
      throw error;
    }

    // The new event exists: only now drop the one created by the old flow (after the response).
    if (previousEventId) {
      sendInBackground(`old Meet event cleanup, match ${slot.match.id}`, [() => deleteMeetEvent(previousEventId)]);
    }

    // 3. Send Confirmation Emails
    const startTimeFormatted = formatRomeDate(slot.startTime, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const icsContent = generateIcsString({
      title: `Colloquio Helllo: ${profName} / ${compName}`,
      description: `Colloquio conoscitivo pianificato tramite Helllo.\nLink call: ${meetingLink || 'Non disponibile'}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      location: meetingLink || undefined,
      uid: slot.match.id
    });

    const attachments = [{
      filename: 'invito-colloquio.ics',
      content: Buffer.from(icsContent)
    }];

    sendInBackground(`call confirmed, match ${slot.match.id}`, [
      () => sendEmail({
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
      () => sendEmail({
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

export async function getCalendarEventsAction() {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };

  const userId = user.id;
  const role = user.role;

  try {
    // 1. Fetch Matches (1-to-1 interviews): only confirmed calls make it to the calendar
    const scheduled = and(eq(matches.companyStatus, 'liked'), eq(matches.professionalStatus, 'liked'), isNotNull(matches.scheduledAt));
    const userMatches = await db.query.matches.findMany({
      where: role === 'company'
        ? and(eq(matches.companyId, userId), scheduled)
        : and(eq(matches.professionalId, userId), scheduled),
      with: matchParties,
    });

    const scheduledMatches = userMatches
      .map(m => {
        const targetName = role === 'company'
          ? professionalDisplayName(m.professional)
          : companyDisplayName(m.company);

        return {
          id: m.id,
          title: `Intervista con ${targetName}`,
          start: m.scheduledAt!,
          end: new Date(new Date(m.scheduledAt!).getTime() + CALL_DURATION_MS),
          type: 'match' as const,
          link: m.meetingLink,
          description: `Colloquio 1-to-1 con ${targetName}`,
          image: role === 'company' ? m.professional.professionalProfile?.photoUrl : m.company.companyProfile?.logoUrl
        };
      });

    // 2. Fetch Smart Interviews
    let smartEvents = [];
    if (role === 'company') {
      const companyEvents = await db.query.interviewEvents.findMany({
        where: (events, { eq }) => eq(events.companyId, userId),
      });
      smartEvents = companyEvents.map(e => ({
        id: e.id,
        title: e.title,
        start: e.date,
        // Events created before end times were saved fall back to one hour
        end: smartEventEnd(e),
        type: 'smart' as const,
        link: e.meetingLink,
        description: e.description || "Sessione Smart Interview",
        image: null
      }));
    } else {
      const professionalBookings = await db.query.interviewBookings.findMany({
        // Cancelled bookings stay in the table but must not show up as appointments.
        where: (bookings, { eq, and }) => and(eq(bookings.professionalId, userId), eq(bookings.status, 'booked')),
        with: {
          event: {
            with: { company: companyWithProfile }
          }
        }
      });
      smartEvents = professionalBookings.map(b => ({
        id: b.event.id,
        title: b.event.title,
        start: b.event.date,
        end: smartEventEnd(b.event),
        type: 'smart' as const,
        link: b.event.meetingLink,
        description: b.event.description || `Ospitato da ${companyDisplayName(b.event.company)}`,
        image: b.event.company.companyProfile?.logoUrl
      }));
    }

    const allEvents = [...scheduledMatches, ...smartEvents].sort((a, b) => a.start.getTime() - b.start.getTime());

    return { success: true, data: allEvents };
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return { error: "Errore durante il recupero del calendario" };
  }
}
