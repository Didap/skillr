"use server";

import { db } from "@/db";
import { reviews, professionalProfiles, companyProfiles, matches, interviewBookings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { CALL_DURATION_MS, smartEventEnd } from "@/lib/calendar-utils";
import { requireUser } from "@/lib/auth-guard";
import { isUniqueViolation } from "@/db/errors";

const MAX_REVIEW_LENGTH = 500;

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
  const user = await requireUser();
  if ("error" in user) return { error: user.error };

  const authorId = user.id;
  const { matchId, interviewBookingId, stars } = data;
  const text = data.text?.trim() || undefined;

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "Rating non valido" };
  if (text && text.length > MAX_REVIEW_LENGTH) return { error: `Il commento può avere al massimo ${MAX_REVIEW_LENGTH} caratteri` };
  if (!!matchId === !!interviewBookingId) return { error: "Recensione non valida" };

  try {
    // 1. Resolve the target from the context and check the caller took part. The target is
    // the other side, so its role follows from which side the author is on.
    let targetId: string;
    let targetRole: "professional" | "company";

    if (matchId) {
      const match = await db.query.matches.findFirst({
        where: eq(matches.id, matchId),
        columns: { professionalId: true, companyId: true, scheduledAt: true },
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

      if (match.professionalId === authorId) {
        targetId = match.companyId;
        targetRole = "company";
      } else {
        targetId = match.professionalId;
        targetRole = "professional";
      }
    } else {
      const booking = await db.query.interviewBookings.findFirst({
        where: eq(interviewBookings.id, interviewBookingId!),
        columns: { professionalId: true, status: true },
        with: { event: { columns: { companyId: true, date: true, startTime: true, endTime: true } } },
      });

      if (!booking) return { error: "Prenotazione non trovata" };
      if (booking.status === "cancelled") return { error: "Questa prenotazione è stata annullata" };

      // The professional reviews the hosting company, the company reviews the professional.
      if (booking.professionalId === authorId) {
        targetId = booking.event.companyId;
        targetRole = "company";
      } else if (booking.event.companyId === authorId) {
        targetId = booking.professionalId;
        targetRole = "professional";
      } else {
        return { error: "Non sei autorizzato a recensire questo incontro" };
      }

      if (Date.now() < smartEventEnd(booking.event).getTime()) {
        return { error: "Potrai lasciare una recensione al termine dell'incontro" };
      }
    }

    // 2. Save the review and refresh the target's aggregates in one transaction
    await db.transaction(async (tx) => {
      const profileTable = targetRole === "professional" ? professionalProfiles : companyProfiles;

      // Lock the profile row first so concurrent reviews of the same user recompute in turn.
      await tx.select({ userId: profileTable.userId })
        .from(profileTable)
        .where(eq(profileTable.userId, targetId))
        .for("update");

      // A second review of the same call hits the unique key (handled below)
      await tx.insert(reviews).values({
        authorId,
        targetId,
        matchId,
        interviewBookingId,
        stars,
        text,
      });

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
    if (isUniqueViolation(error)) {
      return { error: "Hai già lasciato una recensione per questo incontro" };
    }
    console.error("Error saving review:", error);
    return { error: "Errore durante il salvataggio della recensione" };
  }
}
