import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";

export type Side = "professional" | "company";
type MatchRow = typeof matches.$inferSelect;
export type Conversation = { match: MatchRow; side: Side; otherUserId: string };

/**
 * The one access rule for the chat: the viewer is one of the two sides of a mutual match.
 * Every chat action and the Pusher channel authorization go through here.
 */
export async function loadConversation(matchId: string, userId: string): Promise<Conversation | { error: string }> {
  const match = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (!match) return { error: "Conversazione non trovata" };

  const side: Side | null =
    match.professionalId === userId ? "professional" : match.companyId === userId ? "company" : null;
  if (!side) return { error: "Non autorizzato" };

  if (match.professionalStatus !== "liked" || match.companyStatus !== "liked") {
    return { error: "Conversazione non disponibile" };
  }

  return { match, side, otherUserId: side === "professional" ? match.companyId : match.professionalId };
}

/** The read marker of one side of the conversation. */
export function readMarkerOf(match: MatchRow, side: Side) {
  return side === "professional" ? match.professionalLastReadAt : match.companyLastReadAt;
}
