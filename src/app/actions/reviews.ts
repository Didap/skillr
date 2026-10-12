"use server";

import { db } from "@/db";
import { reviews, professionalProfiles, companyProfiles, users, matches, interviewBookings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { CALL_DURATION_MS } from "@/lib/calendar-utils";

// Smart Interview events without an explicit end are shown as 1 hour in the calendar.
const SMART_EVENT_DEFAULT_DURATION_MS = 60 * 60_000;
const MAX_REVIEW_LENGTH = 500;

class DuplicateReviewError extends Error {}

function isUniqueViolation(error: unknown) {
  // drizzle wraps the postgres-js error, so the SQLSTATE can sit on the cause.
  const candidates = [error, (error as { cause?: unknown })?.cause];
  return candidates.some(e => (e as { code?: string } | undefined)?.code === "23505");
}

/**
 * Saves a review for a match call or a Smart Interview booking. The target is always
 * derived server-side (the other party), so nobody can rate an arbitrary user.
 */
export async function saveReviewAction(data: {
  matchId?: string;
  interviewBookingId?: string;
  stars: number;
  text?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  const authorId = session.user.id;
  const { matchId, interviewBookingId, stars } = data;
  const text = data.text?.trim() || undefined;

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "Rating non valido" };
  if (text && text.length > MAX_REVIEW_LENGTH) return { error: `Il commento può avere al massimo ${MAX_REVIEW_LENGTH} caratteri` };
  if (!!matchId === !!interviewBookingId) return { error: "Recensione non valida" };

  try {
    // 1. Resolve the target from the context and check the caller took part
    let targetId: string;

    if (matchId) {
      const match = await db.query.matches.findFirst({
        where: eq(matches.id, matchId),
      });

      if (!match) return { error: "Match non trovato" };

      // Validation: User must be part of the match
      if (match.professionalId !== authorId && match.companyId !== authorId) {
        return { error: "Non sei autorizzato a recensire questo incontro" };
      }

      // Validation: the call must be confirmed and over (same moment the UI unlocks the button)
      if (!match.scheduledAt) return { error: "L'incontro non è ancora stato programmato" };
      if (Date.now() < new Date(match.scheduledAt).getTime() + CALL_DURATION_MS) {
        return { error: "Potrai lasciare una recensione al termine dell'incontro" };
      }

      targetId = match.professionalId === authorId ? match.companyId : match.professionalId;
    } else {
      const booking = await db.query.interviewBookings.findFirst({
        where: eq(interviewBookings.id, interviewBookingId!),
        with: { event: true },
      });

      if (!booking) return { error: "Prenotazione non trovata" };
      if (booking.status === "cancelled") return { error: "Questa prenotazione è stata annullata" };

      // The professional reviews the hosting company, the company reviews the professional.
      if (booking.professionalId === authorId) {
        targetId = booking.event.companyId;
      } else if (booking.event.companyId === authorId) {
        targetId = booking.professionalId;
      } else {
        return { error: "Non sei autorizzato a recensire questo incontro" };
      }

      const eventStart = booking.event.startTime ?? booking.event.date;
      const eventEnd = booking.event.endTime
        ? new Date(booking.event.endTime).getTime()
        : new Date(eventStart).getTime() + SMART_EVENT_DEFAULT_DURATION_MS;
      if (Date.now() < eventEnd) {
        return { error: "Potrai lasciare una recensione al termine dell'incontro" };
      }
    }

    const target = await db.query.users.findFirst({
      where: eq(users.id, targetId),
      columns: { id: true, role: true },
    });

    if (!target) return { error: "Utente target non trovato" };

    // 2. Save the review and refresh the target's aggregates in one transaction
    await db.transaction(async (tx) => {
      const profileTable = target.role === "professional"
        ? professionalProfiles
        : target.role === "company"
          ? companyProfiles
          : null;

      // Lock the profile row first so concurrent reviews of the same user recompute in turn.
      if (profileTable) {
        await tx.select({ userId: profileTable.userId })
          .from(profileTable)
          .where(eq(profileTable.userId, targetId))
          .for("update");
      }

      try {
        await tx.insert(reviews).values({
          authorId,
          targetId,
          matchId,
          interviewBookingId,
          stars,
          text,
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw new DuplicateReviewError();
        throw error;
      }

      if (!profileTable) return;

      // Recomputed from scratch: an incremental update on a rounded average drifts.
      const [stats] = await tx
        .select({
          average: sql<string>`COALESCE(ROUND(AVG(${reviews.stars})::numeric, 1), 0)::text`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(reviews)
        .where(eq(reviews.targetId, targetId));

      await tx.update(profileTable)
        .set({ averageRating: stats.average, reviewCount: stats.count })
        .where(eq(profileTable.userId, targetId));
    });

    revalidatePath("/dashboard");
    revalidatePath(`/profile/${targetId}`);
    if (matchId) revalidatePath(`/matches/${matchId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof DuplicateReviewError || isUniqueViolation(error)) {
      return { error: "Hai già lasciato una recensione per questo incontro" };
    }
    console.error("Error saving review:", error);
    return { error: "Errore durante il salvataggio della recensione" };
  }
}
