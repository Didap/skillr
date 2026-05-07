"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { interviewEvents, interviewBookings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { InterviewEvent } from "@/types/interview";
import { sendEmail } from "@/lib/mail";
import { InterviewLinkEmail } from "@/emails/InterviewLinkEmail";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import React from "react";
import crypto from "crypto";

export async function createInterviewEventAction(data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) {
  console.log("STARTING_EVENT_CREATION_JOURNEY");
  
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    console.error("AUTH_FAILURE: User not logged in or not a company", session?.user);
    return { error: "Sessione non valida o permessi insufficienti." };
  }

  try {
    // 1. Validate mandatory fields
    if (!data.title || !data.date) {
      return { error: "Titolo e Data sono obbligatori." };
    }

    // 2. Prepare the date properly
    // Server actions sometimes stringify Dates, let's ensure we have a valid Date object
    const eventDate = new Date(data.date);
    if (isNaN(eventDate.getTime())) {
      return { error: "Data non valida." };
    }

    // 3. Build the insert object with manual ID to avoid $defaultFn issues
    const eventId = crypto.randomUUID();
    
    const insertValues = {
      id: eventId,
      companyId: session.user.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      topic: data.topic?.trim() || null,
      // Ensure tags is either a non-empty array or null (some drivers prefer null over empty array for text[])
      tags: (data.tags && data.tags.length > 0) ? data.tags : null,
      imageUrl: data.imageUrl || null,
      location: data.location?.trim() || null,
      date: eventDate,
      maxSlots: Math.floor(Number(data.maxSlots)) || 1,
      format: data.format?.trim() || null,
      meetingLink: data.meetingLink?.trim() || null,
    };

    console.log("EXECUTING_INSERT_FOR_ID:", eventId);

    // 4. Perform the insert
    const [newEvent] = await db.insert(interviewEvents)
      .values(insertValues)
      .returning();

    if (!newEvent) {
      throw new Error("Il database non ha restituito l'evento creato.");
    }

    console.log("EVENT_CREATED_SUCCESSFULLY:", newEvent.id);

    revalidatePath("/dashboard/events");
    return { success: true, data: newEvent };
  } catch (error) {
    const err = error as Error & { code?: string; detail?: string; hint?: string };
    console.error("DETAILED_INSERT_ERROR:", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      stack: err.stack
    });
    
    // Friendly error mapping
    if (err.code === '23505') return { error: "Esiste già un evento con questo ID." };
    if (err.code === '23503') return { error: "Errore di riferimento: utente non trovato nel database." };
    if (err.code === '23502') return { error: "Errore: mancano dati obbligatori richiesti dal database." };
    if (err.code === '42P01') return { error: "Configurazione errata: tabella eventi non trovata." };
    
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
        bookings: true
      },
      orderBy: (events, { desc }) => [desc(events.date)],
    });

    const dataWithStats = results.map(event => ({
      ...event,
      bookingCount: event.bookings.length
    }));

    return { success: true, data: dataWithStats };
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

  try {
    // 1. Update the link and fetch event info
    const [updatedEvent] = await db.update(interviewEvents)
      .set({ meetingLink })
      .where(and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, session.user.id)))
      .returning();

    if (!updatedEvent) {
      return { error: "Evento non trovato" };
    }

    // 2. Fetch all booked professionals
    const bookings = await db.query.interviewBookings.findMany({
      where: eq(interviewBookings.eventId, eventId),
      with: {
        professional: true,
      }
    });

    // 3. Fan-out notifications (Transactional Emails)
    const companyName = session.user.name || "Skillr Company";
    const eventDateStr = format(new Date(updatedEvent.date), "EEEE d MMMM 'alle' HH:mm", { locale: it });

    const emailPromises = bookings.map(async (booking) => {
      if (booking.professional?.email) {
        return sendEmail({
          to: booking.professional.email,
          subject: `Link Meeting Disponibile: ${updatedEvent.title}`,
          react: React.createElement(InterviewLinkEmail, {
            userName: booking.professional.name || "Professional",
            eventTitle: updatedEvent.title,
            companyName: companyName,
            meetingLink: meetingLink,
            eventDate: eventDateStr,
          }) as React.ReactElement
        });
      }
    });

    Promise.all(emailPromises).then(results => {
      const failures = results.filter(r => r && !r.success);
      if (failures.length > 0) {
        console.error(`${failures.length} emails failed to send for event ${eventId}`);
      }
    });
    
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    console.error("Error updating meeting link and notifying candidates:", error);
    return { error: "Errore durante l'aggiornamento del link" };
  }
}

export async function getEventByIdAction(eventId: string) {
  try {
    const event = await db.query.interviewEvents.findFirst({
      where: eq(interviewEvents.id, eventId),
      with: {
        company: {
          with: {
            companyProfile: true
          }
        },
        bookings: true
      }
    });

    if (!event) return { error: "Evento non trovato" };

    return { 
      success: true, 
      data: {
        ...event,
        bookingCount: event.bookings.length,
        companyName: event.company?.companyProfile?.companyName || event.company?.name || "Azienda Partner",
        companyImage: event.company?.companyProfile?.logoUrl || event.company?.image || null,
        companyDescription: event.company?.companyProfile?.description || null,
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
        company: {
          with: {
            companyProfile: true
          }
        },
        bookings: true
      },
      orderBy: (events, { asc }) => [asc(events.date)],
    });

    const data = results.map(event => ({
      ...event,
      bookingCount: event.bookings.length,
      companyName: event.company?.companyProfile?.companyName || event.company?.name || "Azienda Partner",
      companyImage: event.company?.companyProfile?.logoUrl || event.company?.image || null,
      companyDescription: event.company?.companyProfile?.description || null,
    }));

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
    const bookings = await db.query.interviewBookings.findMany({
      where: eq(interviewBookings.eventId, eventId),
      with: {
        professional: {
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
        company: {
          with: {
            companyProfile: true
          }
        },
        bookings: true
      },
      orderBy: (events, { asc }) => [asc(events.date)],
    });

    const userBookings = await db.query.interviewBookings.findMany({
      where: (bookings, { eq }) => eq(bookings.professionalId, session.user.id!)
    });

    const dataWithStatus = results.map(event => ({
      ...event,
      bookingCount: event.bookings.length,
      companyName: event.company?.companyProfile?.companyName || event.company?.name || "Azienda Partner",
      companyImage: event.company?.companyProfile?.logoUrl || event.company?.image || null,
      isBooked: userBookings.some(b => b.eventId === event.id)
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

  try {
    // 1. Check if event exists and has space
    const event = await db.query.interviewEvents.findFirst({
      where: eq(interviewEvents.id, eventId),
      with: {
        bookings: true
      }
    });

    if (!event) return { error: "Evento non trovato" };
    if (event.bookings.length >= event.maxSlots) {
      return { error: "Posti esauriti per questo evento" };
    }

    // 2. Check if already booked
    const existing = await db.query.interviewBookings.findFirst({
      where: and(
        eq(interviewBookings.eventId, eventId),
        eq(interviewBookings.professionalId, session.user.id)
      )
    });

    if (existing) return { error: "Sei già iscritto a questo evento" };

    // 3. Create booking
    await db.insert(interviewBookings).values({
      eventId,
      professionalId: session.user.id,
      status: 'booked'
    });

    revalidatePath("/dashboard/smart-interviews");
    return { success: true };
  } catch (error) {
    console.error("Error booking interview:", error);
    return { error: "Errore durante la prenotazione" };
  }
}

export async function updateInterviewEventAction(eventId: string, data: Partial<Omit<InterviewEvent, "id" | "companyId" | "createdAt">>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    return { error: "Non autorizzato" };
  }

  try {
    // 1. Verify ownership
    const existing = await db.query.interviewEvents.findFirst({
      where: and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, session.user.id))
    });

    if (!existing) return { error: "Evento non trovato o non sei l'organizzatore." };

    // 2. Prepare update data
    const updateData: Partial<InterviewEvent> = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    // 3. Update
    const [updated] = await db.update(interviewEvents)
      .set(updateData)
      .where(and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, session.user.id)))
      .returning();

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

  try {
    const [deleted] = await db.delete(interviewEvents)
      .where(and(eq(interviewEvents.id, eventId), eq(interviewEvents.companyId, session.user.id)))
      .returning();

    if (!deleted) return { error: "Evento non trovato o non sei l'organizzatore." };

    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { error: "Errore durante l'eliminazione dell'evento" };
  }
}
