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

export async function createInterviewEventAction(data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    return { error: "Non autorizzato" };
  }

  try {
    const [newEvent] = await db.insert(interviewEvents).values({
      companyId: session.user.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      maxSlots: data.maxSlots,
      format: data.format,
      meetingLink: data.meetingLink,
    }).returning();

    revalidatePath("/dashboard/events");
    return { success: true, data: newEvent };
  } catch (error) {
    console.error("Error creating interview event:", error);
    return { error: "Errore durante la creazione dell'evento" };
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
    // We do this asynchronously without waiting for all of them to finish if it's a lot,
    // but for now, we'll wait to ensure we handle errors.
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

    // We don't want to block the UI response if there are many emails, 
    // but we want to log if any fail.
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
        company: true,
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
      companyName: event.company?.name || "Azienda Partner",
      companyImage: event.company?.image || null,
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
