"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { interviewEvents, interviewBookings, companyProfiles } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { InterviewEvent } from "@/types/interview";
import { sendEmail } from "@/lib/mail";
import { InterviewLinkEmail } from "@/emails/InterviewLinkEmail";
import { InterviewEventChangeEmail } from "@/emails/InterviewEventChangeEmail";
import { formatEventDateTime, isSafeHttpUrl } from "@/lib/rome-time";
import React from "react";
import crypto from "crypto";
import { publicUserColumns } from "@/db/safe-columns";

type EventInput = Partial<Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">>;
type EventRow = typeof interviewEvents.$inferSelect;
type EventValues = Partial<typeof interviewEvents.$inferInsert>;

// Only active bookings take a seat: cancelled ones stay in the table (unique on event +
// professional) and are re-activated if the professional books again.
const bookedOnly = {
  where: eq(interviewBookings.status, "booked"),
  columns: { professionalId: true },
} as const;

const companyWithProfile = {
  columns: publicUserColumns,
  with: { companyProfile: true },
} as const;

type CompanyWithProfile = {
  name: string | null;
  image: string | null;
  companyProfile: {
    companyName: string | null;
    logoUrl: string | null;
    description: string | null;
    websiteUrl: string | null;
  } | null;
} | null;

// Shape sent to the client. The meeting link is only for the organizer and for booked
// professionals; the booking rows themselves (who booked) never leave the server.
function presentEvent(
  event: EventRow & { bookings: { professionalId: string }[]; company?: CompanyWithProfile },
  includeMeetingLink: boolean
) {
  const profile = event.company?.companyProfile;
  return {
    id: event.id,
    companyId: event.companyId,
    title: event.title,
    description: event.description,
    topic: event.topic,
    tags: event.tags,
    imageUrl: event.imageUrl,
    location: event.location,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    maxSlots: event.maxSlots,
    format: event.format,
    meetingLink: includeMeetingLink ? event.meetingLink : null,
    createdAt: event.createdAt,
    bookingCount: event.bookings.length,
    companyName: profile?.companyName || event.company?.name || "Azienda Partner",
    companyImage: profile?.logoUrl || event.company?.image || null,
    companyDescription: profile?.description || null,
    companyWebsite: isSafeHttpUrl(profile?.websiteUrl) ? profile.websiteUrl : null,
  };
}

// Validates and normalizes form input. With `partial`, missing keys are left untouched.
function normalizeEventInput(data: EventInput, partial: boolean): { error: string } | { values: EventValues } {
  const values: EventValues = {};
  const has = (key: keyof EventInput) => !partial || data[key] !== undefined;
  const text = (value: string | null | undefined) => value?.trim() || null;

  if (has("title")) {
    const title = data.title?.trim();
    if (!title) return { error: "Il titolo è obbligatorio." };
    values.title = title;
  }
  if (has("date")) {
    const date = data.date ? new Date(data.date) : null;
    if (!date || isNaN(date.getTime())) return { error: "Data non valida." };
    values.date = date;
    values.startTime = date;
  }
  if (has("endTime")) {
    const end = data.endTime ? new Date(data.endTime) : null;
    if (end && isNaN(end.getTime())) return { error: "Orario di fine non valido." };
    values.endTime = end;
  }
  if (has("maxSlots")) {
    const slots = Number(data.maxSlots);
    if (!Number.isInteger(slots) || slots < 1) {
      return { error: "I posti devono essere un numero intero maggiore o uguale a 1." };
    }
    values.maxSlots = slots;
  }
  if (has("meetingLink")) {
    const link = text(data.meetingLink);
    if (link && !isSafeHttpUrl(link)) return { error: "Il link del meeting deve iniziare con https:// o http://." };
    values.meetingLink = link;
  }
  if (has("description")) values.description = text(data.description);
  if (has("topic")) values.topic = text(data.topic);
  if (has("location")) values.location = text(data.location);
  if (has("format")) values.format = text(data.format);
  if (has("imageUrl")) values.imageUrl = data.imageUrl || null;
  if (has("tags")) {
    // Some drivers prefer null over an empty text[]
    const tags = Array.isArray(data.tags) ? data.tags.map(String).filter(Boolean) : [];
    values.tags = tags.length > 0 ? tags : null;
  }

  return { values };
}

async function getCompanyDisplayName(companyId: string, fallback?: string | null) {
  const profile = await db.query.companyProfiles.findFirst({
    where: eq(companyProfiles.userId, companyId),
    columns: { companyName: true },
  });
  return profile?.companyName?.trim() || fallback?.trim() || "Azienda Partner";
}

// Sends emails after the response is sent. A failed email is logged and never fails the action.
function sendInBackground(label: string, sends: (() => Promise<{ success: boolean }>)[]) {
  if (sends.length === 0) return;
  const run = async () => {
    const results = await Promise.allSettled(sends.map((send) => send()));
    const failures = results.filter((r) => r.status === "rejected" || !r.value.success).length;
    if (failures > 0) console.error(`${failures}/${sends.length} emails failed to send (${label})`);
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

// Drizzle wraps driver errors (DrizzleQueryError), the Postgres code is on `cause`
function pgErrorCode(error: unknown): string | undefined {
  const err = error as { code?: string; cause?: { code?: string } };
  return err?.code ?? err?.cause?.code;
}

function eventUrl(eventId: string) {
  return process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/dashboard/events/${eventId}` : undefined;
}

export async function createInterviewEventAction(data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    console.error("AUTH_FAILURE: User not logged in or not a company", session?.user);
    return { error: "Sessione non valida o permessi insufficienti." };
  }

  try {
    // 1. Validate and normalize (dates may arrive stringified from the client)
    const parsed = normalizeEventInput(data, false);
    if ("error" in parsed) return { error: parsed.error };
    const { values } = parsed;

    if (!values.date || values.date.getTime() <= Date.now()) {
      return { error: "La data dell'evento deve essere nel futuro." };
    }
    if (values.endTime && values.endTime.getTime() <= values.date.getTime()) {
      return { error: "L'orario di fine deve essere successivo all'inizio." };
    }

    // 2. Insert with a manual ID to avoid $defaultFn issues
    const [newEvent] = await db.insert(interviewEvents)
      .values({
        ...values,
        id: crypto.randomUUID(),
        companyId: session.user.id,
        title: values.title!,
        date: values.date,
        maxSlots: values.maxSlots!,
      })
      .returning();

    if (!newEvent) {
      throw new Error("Il database non ha restituito l'evento creato.");
    }

    revalidatePath("/dashboard/events");
    return { success: true, data: newEvent };
  } catch (error) {
    const err = error as Error & { code?: string; detail?: string; hint?: string };
    const code = pgErrorCode(error);
    console.error("DETAILED_INSERT_ERROR:", {
      message: err.message,
      code,
      detail: err.detail,
      hint: err.hint,
      stack: err.stack
    });

    // Friendly error mapping
    if (code === '23505') return { error: "Esiste già un evento con questo ID." };
    if (code === '23503') return { error: "Errore di riferimento: utente non trovato nel database." };
    if (code === '23502') return { error: "Errore: mancano dati obbligatori richiesti dal database." };
    if (code === '42P01') return { error: "Configurazione errata: tabella eventi non trovata." };

    return { error: `Errore tecnico: ${err.message || "Impossibile salvare l'evento"}` };
  }
}

export async function getCompanyEvents() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const results = await db.query.interviewEvents.findMany({
      where: (events, { eq }) => eq(events.companyId, session.user.id),
      with: {
        bookings: bookedOnly
      },
      orderBy: (events, { desc }) => [desc(events.date)],
    });

    const data = results.map(event => presentEvent(event, true));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching interview events:", error);
    return { error: "Errore durante il recupero degli eventi" };
  }
}

export async function updateMeetingLinkAction(eventId: string, meetingLink: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    return { error: "Non autorizzato" };
  }

  const link = meetingLink?.trim();
  if (!isSafeHttpUrl(link)) {
    return { error: "Inserisci un link valido che inizi con https:// o http://." };
  }

  try {
    // 1. Update the link and fetch event info
    const [updatedEvent] = await db.update(interviewEvents)
      .set({ meetingLink: link })
      .where(and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, session.user.id)))
      .returning();

    if (!updatedEvent) {
      return { error: "Evento non trovato" };
    }

    // 2. Fetch the professionals still booked
    const bookings = await db.query.interviewBookings.findMany({
      where: and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.status, "booked")),
      with: {
        professional: { columns: publicUserColumns },
      }
    });

    // 3. Fan-out notifications (Transactional Emails)
    const companyName = await getCompanyDisplayName(session.user.id, session.user.name);
    const eventDateStr = formatEventDateTime(updatedEvent.date);

    sendInBackground(`meeting link, event ${eventId}`, bookings
      .filter(booking => booking.professional?.email)
      .map(booking => () => sendEmail({
        to: booking.professional.email,
        subject: `Link Meeting Disponibile: ${updatedEvent.title}`,
        react: React.createElement(InterviewLinkEmail, {
          userName: booking.professional.name || "Professionista",
          eventTitle: updatedEvent.title,
          companyName,
          meetingLink: link,
          eventDate: eventDateStr,
        }) as React.ReactElement
      })));

    revalidatePath("/dashboard/events");
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating meeting link and notifying candidates:", error);
    return { error: "Errore durante l'aggiornamento del link" };
  }
}

export async function getEventByIdAction(eventId: string) {
  try {
    const session = await auth();
    const event = await db.query.interviewEvents.findFirst({
      where: eq(interviewEvents.id, eventId),
      with: {
        company: companyWithProfile,
        bookings: bookedOnly
      }
    });

    if (!event) return { error: "Evento non trovato" };

    const viewerId = session?.user?.id;
    const isOwner = !!viewerId && viewerId === event.companyId;
    const isBooked = !!viewerId && event.bookings.some(b => b.professionalId === viewerId);

    return {
      success: true,
      data: {
        ...presentEvent(event, isOwner || isBooked),
        isOwner,
        isBooked,
        isPast: event.date.getTime() <= Date.now(),
      }
    };
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    return { error: "Errore durante il recupero dell'evento" };
  }
}

export async function getPublicEventsAction() {
  try {
    const results = await db.query.interviewEvents.findMany({
      where: (events, { gte }) => gte(events.date, new Date()),
      with: {
        company: companyWithProfile,
        bookings: bookedOnly
      },
      orderBy: (events, { asc }) => [asc(events.date)],
    });

    const data = results.map(event => presentEvent(event, false));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching public events:", error);
    return { error: "Errore durante il recupero degli eventi" };
  }
}

export async function getEventParticipantsAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    return { error: "Non autorizzato" };
  }

  try {
    // Only the organizer can see who booked
    const event = await db.query.interviewEvents.findFirst({
      where: and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, session.user.id)),
      columns: { id: true },
    });
    if (!event) return { error: "Evento non trovato o non sei l'organizzatore." };

    const bookings = await db.query.interviewBookings.findMany({
      where: and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.status, "booked")),
      with: {
        professional: {
          columns: publicUserColumns,
          with: {
            professionalProfile: true
          }
        }
      }
    });

    const participants = bookings.map(b => ({
      id: b.professional.id,
      name: b.professional.name,
      email: b.professional.email,
      image: b.professional.image,
      title: b.professional.professionalProfile?.title,
      photoUrl: b.professional.professionalProfile?.photoUrl,
    }));

    return { success: true, data: participants };
  } catch (error) {
    console.error("Error fetching event participants:", error);
    return { error: "Errore durante il recupero dei partecipanti" };
  }
}

export async function getAvailableEventsAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const results = await db.query.interviewEvents.findMany({
      where: (events, { gte }) => gte(events.date, new Date()),
      with: {
        company: companyWithProfile,
        bookings: bookedOnly
      },
      orderBy: (events, { asc }) => [asc(events.date)],
    });

    const dataWithStatus = results.map(event => ({
      ...presentEvent(event, false),
      isBooked: event.bookings.some(b => b.professionalId === session.user.id)
    }));

    return { success: true, data: dataWithStatus };
  } catch (error) {
    console.error("Error fetching available events:", error);
    return { error: "Errore durante il recupero degli eventi" };
  }
}

export async function bookInterviewAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'professional') {
    return { error: "Solo i professionisti possono prenotare" };
  }
  const professionalId = session.user.id;

  try {
    // Check and write in one transaction, with the event row locked: concurrent bookings for
    // the same event queue up here, so the seat count can't go past maxSlots.
    const result = await db.transaction(async (tx) => {
      const [event] = await tx
        .select({ date: interviewEvents.date, maxSlots: interviewEvents.maxSlots, meetingLink: interviewEvents.meetingLink })
        .from(interviewEvents)
        .where(eq(interviewEvents.id, eventId))
        .for("update");

      if (!event) return { error: "Evento non trovato" };
      if (event.date.getTime() <= Date.now()) {
        return { error: "Evento concluso: non è più possibile prenotare." };
      }

      const [existing] = await tx
        .select({ id: interviewBookings.id, status: interviewBookings.status })
        .from(interviewBookings)
        .where(and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.professionalId, professionalId)));

      if (existing?.status === "booked") return { error: "Hai già prenotato questo evento." };

      const [{ value: booked }] = await tx
        .select({ value: count() })
        .from(interviewBookings)
        .where(and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.status, "booked")));

      if (booked >= event.maxSlots) return { error: "Posti esauriti per questo evento." };

      if (existing) {
        // Booked before and cancelled: the unique key allows one row, so re-activate it
        await tx.update(interviewBookings)
          .set({ status: "booked" })
          .where(eq(interviewBookings.id, existing.id));
      } else {
        await tx.insert(interviewBookings).values({
          eventId,
          professionalId,
          status: "booked"
        });
      }
      // Now booked, so the professional is allowed to see the link
      return { success: true as const, meetingLink: event.meetingLink };
    });

    if ("error" in result) return { error: result.error };

    revalidatePath("/dashboard/smart-interviews");
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true, meetingLink: result.meetingLink };
  } catch (error) {
    if (pgErrorCode(error) === "23505") return { error: "Hai già prenotato questo evento." };
    console.error("Error booking interview:", error);
    return { error: "Errore durante la prenotazione" };
  }
}

export async function cancelInterviewBookingAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'professional') {
    return { error: "Non autorizzato" };
  }
  const professionalId = session.user.id;

  try {
    const result = await db.transaction(async (tx) => {
      const [event] = await tx
        .select({ date: interviewEvents.date })
        .from(interviewEvents)
        .where(eq(interviewEvents.id, eventId))
        .for("update");

      if (!event) return { error: "Evento non trovato" };
      if (event.date.getTime() <= Date.now()) {
        return { error: "L'evento è già iniziato: non puoi più annullare la prenotazione." };
      }

      const [cancelled] = await tx.update(interviewBookings)
        .set({ status: "cancelled" })
        .where(and(
          eq(interviewBookings.eventId, eventId),
          eq(interviewBookings.professionalId, professionalId),
          eq(interviewBookings.status, "booked")
        ))
        .returning({ id: interviewBookings.id });

      if (!cancelled) return { error: "Non hai una prenotazione attiva per questo evento." };
      return { success: true as const };
    });

    if ("error" in result) return { error: result.error };

    revalidatePath("/dashboard/smart-interviews");
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Error cancelling interview booking:", error);
    return { error: "Errore durante l'annullamento della prenotazione" };
  }
}

export async function updateInterviewEventAction(eventId: string, data: Partial<Omit<InterviewEvent, "id" | "companyId" | "createdAt">>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    return { error: "Non autorizzato" };
  }
  const companyId = session.user.id;

  // 1. Validate: only known fields are written (never id/companyId from the client)
  const parsed = normalizeEventInput(data, true);
  if ("error" in parsed) return { error: parsed.error };
  const values = parsed.values;

  try {
    const result = await db.transaction(async (tx) => {
      // 2. Verify ownership, locking the row so no booking lands while seats are checked
      const [existing] = await tx
        .select()
        .from(interviewEvents)
        .where(and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, companyId)))
        .for("update");

      if (!existing) return { error: "Evento non trovato o non sei l'organizzatore." };

      const start = values.date ?? existing.date;
      if (values.date && values.date.getTime() !== existing.date.getTime() && values.date.getTime() <= Date.now()) {
        return { error: "La nuova data dell'evento deve essere nel futuro." };
      }
      // Moving the start without a new end keeps the same duration
      if (values.endTime === undefined && values.date && existing.endTime) {
        values.endTime = new Date(existing.endTime.getTime() + (values.date.getTime() - existing.date.getTime()));
      }
      const end = values.endTime !== undefined ? values.endTime : existing.endTime;
      if (end && end.getTime() <= start.getTime()) {
        return { error: "L'orario di fine deve essere successivo all'inizio." };
      }

      if (values.maxSlots !== undefined) {
        const [{ value: booked }] = await tx
          .select({ value: count() })
          .from(interviewBookings)
          .where(and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.status, "booked")));
        if (values.maxSlots < booked) {
          return { error: `Ci sono già ${booked} iscritti: i posti non possono essere meno di ${booked}.` };
        }
      }

      // 3. Update
      const [updated] = Object.keys(values).length > 0
        ? await tx.update(interviewEvents)
            .set(values)
            .where(eq(interviewEvents.id, eventId))
            .returning()
        : [existing];

      return { existing, updated };
    });

    if ("error" in result) return { error: result.error };
    const { existing, updated } = result;

    // 4. Tell booked professionals when the logistics changed (only for upcoming events)
    const changes: string[] = [];
    if (updated.date.getTime() !== existing.date.getTime() || updated.endTime?.getTime() !== existing.endTime?.getTime()) {
      changes.push("data e orario");
    }
    if ((updated.location || null) !== (existing.location || null)) changes.push("luogo");
    if ((updated.meetingLink || null) !== (existing.meetingLink || null)) changes.push("link del meeting");

    if (changes.length > 0 && updated.date.getTime() > Date.now()) {
      const bookings = await db.query.interviewBookings.findMany({
        where: and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.status, "booked")),
        with: { professional: { columns: publicUserColumns } },
      });
      const companyName = await getCompanyDisplayName(companyId, session.user.name);
      const eventDate = formatEventDateTime(updated.date);

      sendInBackground(`event update, event ${eventId}`, bookings
        .filter(booking => booking.professional?.email)
        .map(booking => () => sendEmail({
          to: booking.professional.email,
          subject: `Smart Interview aggiornata: ${updated.title}`,
          react: React.createElement(InterviewEventChangeEmail, {
            kind: "updated",
            userName: booking.professional.name || "Professionista",
            eventTitle: updated.title,
            companyName,
            eventDate,
            location: updated.location,
            meetingLink: updated.meetingLink,
            changes,
            eventUrl: eventUrl(eventId),
          }) as React.ReactElement
        })));
    }

    revalidatePath("/dashboard/events");
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating event:", error);
    const err = error as Error;
    return { error: `Errore durante l'aggiornamento: ${err.message}` };
  }
}

export async function deleteInterviewEventAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    return { error: "Non autorizzato" };
  }
  const companyId = session.user.id;

  try {
    // Bookings cascade with the event, so collect who to notify before deleting
    const result = await db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(interviewEvents)
        .where(and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, companyId)))
        .for("update");

      if (!event) return { error: "Evento non trovato o non sei l'organizzatore." };

      const bookings = event.date.getTime() > Date.now()
        ? await tx.query.interviewBookings.findMany({
            where: and(eq(interviewBookings.eventId, eventId), eq(interviewBookings.status, "booked")),
            with: { professional: { columns: publicUserColumns } },
          })
        : [];

      await tx.delete(interviewEvents).where(eq(interviewEvents.id, eventId));
      return { event, bookings };
    });

    if ("error" in result) return { error: result.error };
    const { event, bookings } = result;

    if (bookings.length > 0) {
      const companyName = await getCompanyDisplayName(companyId, session.user.name);
      const eventDate = formatEventDateTime(event.date);

      sendInBackground(`event cancelled, event ${eventId}`, bookings
        .filter(booking => booking.professional?.email)
        .map(booking => () => sendEmail({
          to: booking.professional.email,
          subject: `Smart Interview annullata: ${event.title}`,
          react: React.createElement(InterviewEventChangeEmail, {
            kind: "cancelled",
            userName: booking.professional.name || "Professionista",
            eventTitle: event.title,
            companyName,
            eventDate,
          }) as React.ReactElement
        })));
    }

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard/smart-interviews");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { error: "Errore durante l'eliminazione dell'evento" };
  }
}
