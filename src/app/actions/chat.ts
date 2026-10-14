"use server";

import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { chatMessages, matches } from "@/db/schema";
import { requireUser } from "@/lib/auth-guard";
import { loadConversation, readMarkerOf } from "@/lib/chat/access";
import { isInMatchFolder } from "@/lib/chat/attachments";
import { CHAT_EVENTS, matchChannel, userChannel } from "@/lib/chat/channels";
import { toChatMessage } from "@/lib/chat/messages";
import {
  AFTER_LIMIT,
  ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_BODY_LENGTH,
  PAGE_SIZE,
  type ChatMessage,
  type SendMessageInput,
  type ThreadPage,
} from "@/lib/chat/types";
import { publish } from "@/lib/pusher/server";

// Pusher socket ids look like "123.456"; anything else is dropped, not an error
const socketIdSchema = z.string().regex(/^\d+\.\d+$/).optional().catch(undefined);

class ConversationClosed extends Error {}

/** The signed-in user and their conversation, or the error to return. */
async function viewerConversation(matchId: string) {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };
  const convo = await loadConversation(matchId, user.id);
  if ("error" in convo) return { error: convo.error };
  return { user, convo };
}

const cursorSchema = z
  .object({ before: z.string().min(1).optional(), after: z.string().min(1).optional() })
  .refine((c) => !(c.before && c.after));

/**
 * A page of the thread, oldest first. Without a cursor: the latest PAGE_SIZE messages.
 * `before`: older ones (scrolling up). `after`: newer ones (catching up after a reconnect).
 * Cursors are message ids compared as (created_at, id) in SQL, so JS millisecond rounding
 * never skips or repeats a message; a cursor from another match matches nothing.
 */
export async function getMessages(matchId: string, cursor: { before?: string; after?: string } = {}) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  const parsed = cursorSchema.safeParse(cursor);
  if (!parsed.success) return { error: "Richiesta non valida" };
  const { before, after } = parsed.data;

  try {
    const pivot = (id: string) =>
      sql`(select c.created_at, c.id from chat_messages c where c.id = ${id} and c.match_id = ${matchId})`;
    const where = and(
      eq(chatMessages.matchId, matchId),
      before ? sql`(${chatMessages.createdAt}, ${chatMessages.id}) < ${pivot(before)}` : undefined,
      after ? sql`(${chatMessages.createdAt}, ${chatMessages.id}) > ${pivot(after)}` : undefined
    );

    const rows = after
      ? await db.select().from(chatMessages).where(where)
          .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id)).limit(AFTER_LIMIT)
      : await db.select().from(chatMessages).where(where)
          .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id)).limit(PAGE_SIZE + 1);

    const hasMore = !after && rows.length > PAGE_SIZE;
    const page = after ? rows : rows.slice(0, PAGE_SIZE).reverse();
    const { match, side } = ctx.convo;
    const otherLastReadAt = readMarkerOf(match, side === "professional" ? "company" : "professional");

    const data: ThreadPage = {
      messages: page.map(toChatMessage),
      hasMore,
      otherLastReadAt: otherLastReadAt?.toISOString() ?? null,
      blockedById: match.blockedById,
    };
    return { success: true as const, data };
  } catch (error) {
    console.error("Error loading chat messages:", error);
    return { error: "Errore durante il caricamento dei messaggi" };
  }
}

const sendSchema = z.object({
  clientId: z.string().min(1).max(64),
  body: z.string().trim().max(MAX_BODY_LENGTH, `Massimo ${MAX_BODY_LENGTH} caratteri`).optional(),
  attachment: z
    .object({
      publicId: z.string().min(1).max(300),
      name: z.string().trim().min(1).max(200),
      mime: z.enum(ATTACHMENT_MIME_TYPES),
      size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
    })
    .optional(),
  socketId: socketIdSchema,
});

export async function sendMessage(matchId: string, input: SendMessageInput) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Messaggio non valido" };

  const { clientId, attachment, socketId } = parsed.data;
  const body = parsed.data.body || null;
  if (!body && !attachment) return { error: "Il messaggio è vuoto" };
  if (attachment && !isInMatchFolder(attachment.publicId, matchId)) return { error: "Allegato non valido" };

  const { user, convo } = ctx;
  if (convo.match.blockedById) return { error: "Questa conversazione è chiusa" };

  try {
    const [{ recent }] = await db
      .select({ recent: count() })
      .from(chatMessages)
      .where(and(eq(chatMessages.senderId, user.id), sql`${chatMessages.createdAt} > now() - interval '10 seconds'`));
    if (recent >= 20) return { error: "Stai inviando troppi messaggi. Riprova tra qualche secondo." };

    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(chatMessages)
        .values({
          matchId,
          senderId: user.id,
          body,
          attachmentPublicId: attachment?.publicId ?? null,
          attachmentName: attachment?.name ?? null,
          attachmentMime: attachment?.mime ?? null,
          attachmentSize: attachment?.size ?? null,
        })
        .returning();
      // now() is the transaction's start time, the same instant as the message's created_at.
      // The guard on blocked_by_id makes a block that lands mid-send roll the insert back.
      const marker = convo.side === "professional" ? { professionalLastReadAt: sql`now()` } : { companyLastReadAt: sql`now()` };
      const updated = await tx
        .update(matches)
        .set({ lastMessageAt: sql`now()`, ...marker })
        .where(and(eq(matches.id, matchId), isNull(matches.blockedById)))
        .returning({ id: matches.id });
      if (updated.length === 0) throw new ConversationClosed();
      return inserted;
    });

    const message: ChatMessage = toChatMessage(row);
    await Promise.all([
      publish(matchChannel(matchId), CHAT_EVENTS.newMessage, message, socketId),
      publish([userChannel(convo.otherUserId), userChannel(user.id)], CHAT_EVENTS.inbox, { matchId }, socketId),
    ]);
    return { success: true as const, data: { message, clientId } };
  } catch (error) {
    if (error instanceof ConversationClosed) return { error: "Questa conversazione è chiusa" };
    console.error("Error sending chat message:", error);
    return { error: "Messaggio non inviato. Riprova." };
  }
}
