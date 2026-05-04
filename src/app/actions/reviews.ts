"use server";

import { db } from "@/db";
import { reviews, professionalProfiles, companyProfiles, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveReviewAction(data: {
  matchId?: string;
  interviewBookingId?: string;
  targetId: string;
  stars: number;
  text?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  const authorId = session.user.id;
  const { matchId, interviewBookingId, targetId, stars, text } = data;

  if (stars < 1 || stars > 5) return { error: "Rating non valido" };

  try {
    const conditions = [eq(reviews.authorId, authorId)];
    if (matchId) {
      conditions.push(eq(reviews.matchId, matchId));
    } else if (interviewBookingId) {
      conditions.push(eq(reviews.interviewBookingId, interviewBookingId));
    } else {
      // If no context is provided, we only check for a direct review of the target
      conditions.push(eq(reviews.targetId, targetId));
    }

    const existing = await db.query.reviews.findFirst({
      where: and(...conditions),
    });

    if (existing) return { error: "Hai già lasciato una recensione per questo incontro" };

    // 2. Save review
    await db.insert(reviews).values({
      authorId,
      targetId,
      matchId,
      interviewBookingId,
      stars,
      text,
    });

    // 3. Update target profile
    // First, find target's role
    const target = await db.query.users.findFirst({
      where: eq(users.id, targetId),
      with: {
          professionalProfile: true,
          companyProfile: true
      }
    });

    if (!target) return { error: "Utente target non trovato" };

    const isProfessional = !!target.professionalProfile;
    
    if (isProfessional) {
        await db.update(professionalProfiles)
          .set({
            reviewCount: sql`${professionalProfiles.reviewCount} + 1`,
            averageRating: sql`ROUND(((${professionalProfiles.averageRating}::numeric * ${professionalProfiles.reviewCount} + ${stars}) / (${professionalProfiles.reviewCount} + 1)), 1)::text`
          })
          .where(eq(professionalProfiles.userId, targetId));
    } else {
        await db.update(companyProfiles)
          .set({
            reviewCount: sql`${companyProfiles.reviewCount} + 1`,
            averageRating: sql`ROUND(((${companyProfiles.averageRating}::numeric * ${companyProfiles.reviewCount} + ${stars}) / (${companyProfiles.reviewCount} + 1)), 1)::text`
          })
          .where(eq(companyProfiles.userId, targetId));
    }

    revalidatePath("/dashboard");
    if (matchId) revalidatePath(`/matches/${matchId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving review:", error);
    return { error: "Errore durante il salvataggio della recensione" };
  }
}
