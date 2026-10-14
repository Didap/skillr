"use server";

import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { chatMessages, chatReports, matches } from "@/db/schema";
import { requireUser } from "@/lib/auth-guard";
import { cloudinary } from "@/lib/cloudinary";
import { loadConversation, readMarkerOf } from "@/lib/chat/access";
import { chatFolder, isInMatchFolder } from "@/lib/chat/attachments";
import { CHAT_EVENTS, matchChannel, userChannel } from "@/lib/chat/channels";
import { toChatMessage } from "@/lib/chat/messages";
import { buildReportEmail } from "@/lib/chat/report-email";
import { unreadTotal } from "@/lib/chat/summaries";
import {
  AFTER_LIMIT,
  ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_BODY_LENGTH,
  PAGE_SIZE,
  type AttachmentMime,
  type ChatMessage,
  type ReportInput,
  type SendMessageInput,
  type ThreadPage,
  type UploadedAttachment,
} from "@/lib/chat/types";
import { sendEmail, sendInBackground } from "@/lib/mail";
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
      // No socketId: the sender's own tab must also get the inbox update (same socket as its provider)
      publish([userChannel(convo.otherUserId), userChannel(user.id)], CHAT_EVENTS.inbox, { matchId }),
    ]);
    return { success: true as const, data: { message, clientId } };
  } catch (error) {
    if (error instanceof ConversationClosed) return { error: "Questa conversazione è chiusa" };
    console.error("Error sending chat message:", error);
    return { error: "Messaggio non inviato. Riprova." };
  }
}

/** Moves the viewer's read marker to now and tells the other side (read receipt). */
export async function markRead(matchId: string, socketId?: string) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  const { user, convo } = ctx;
  const socket = socketIdSchema.parse(socketId);

  try {
    const marker = convo.side === "professional" ? { professionalLastReadAt: sql`now()` } : { companyLastReadAt: sql`now()` };
    const [row] = await db
      .update(matches)
      .set(marker)
      .where(eq(matches.id, matchId))
      .returning({ professionalLastReadAt: matches.professionalLastReadAt, companyLastReadAt: matches.companyLastReadAt });
    const readAt = (convo.side === "professional" ? row.professionalLastReadAt : row.companyLastReadAt)!.toISOString();

    await Promise.all([
      publish(matchChannel(matchId), CHAT_EVENTS.read, { userId: user.id, readAt }, socket),
      // Not skipping the socket: the reader's own badge must update too
      publish(userChannel(user.id), CHAT_EVENTS.inbox, { matchId }),
    ]);
    return { success: true as const, data: { readAt } };
  } catch (error) {
    console.error("Error marking chat as read:", error);
    return { error: "Errore durante l'aggiornamento della chat" };
  }
}

export async function getUnreadTotal() {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };
  try {
    return { success: true as const, data: await unreadTotal(user.id) };
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return { error: "Errore durante il conteggio dei messaggi" };
  }
}

/** Sets the block if nobody has blocked yet; returns who holds the block now. */
async function applyBlock(matchId: string, userId: string, otherUserId: string) {
  const updated = await db
    .update(matches)
    .set({ blockedById: userId, blockedAt: sql`now()` })
    .where(and(eq(matches.id, matchId), isNull(matches.blockedById)))
    .returning({ blockedById: matches.blockedById });
  if (updated.length > 0) {
    await Promise.all([
      publish(matchChannel(matchId), CHAT_EVENTS.blocked, { blockedById: userId }),
      publish([userChannel(otherUserId), userChannel(userId)], CHAT_EVENTS.inbox, { matchId }),
    ]);
    return userId;
  }
  const [current] = await db.select({ blockedById: matches.blockedById }).from(matches).where(eq(matches.id, matchId));
  return current?.blockedById ?? userId;
}

export async function blockConversation(matchId: string) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  try {
    const blockedById = await applyBlock(matchId, ctx.user.id, ctx.convo.otherUserId);
    return { success: true as const, data: { blockedById } };
  } catch (error) {
    console.error("Error blocking conversation:", error);
    return { error: "Errore durante il blocco della conversazione" };
  }
}

export async function unblockConversation(matchId: string) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  const { user, convo } = ctx;
  if (convo.match.blockedById !== user.id) return { error: "Solo chi ha bloccato la conversazione può sbloccarla" };
  try {
    await db
      .update(matches)
      .set({ blockedById: null, blockedAt: null })
      .where(and(eq(matches.id, matchId), eq(matches.blockedById, user.id)));
    await Promise.all([
      publish(matchChannel(matchId), CHAT_EVENTS.unblocked, {}),
      publish([userChannel(convo.otherUserId), userChannel(user.id)], CHAT_EVENTS.inbox, { matchId }),
    ]);
    return { success: true as const, data: { blockedById: null } };
  } catch (error) {
    console.error("Error unblocking conversation:", error);
    return { error: "Errore durante lo sblocco della conversazione" };
  }
}

const reportSchema = z.object({
  reason: z.enum(["spam", "harassment", "inappropriate", "scam", "other"]),
  details: z.string().trim().max(1000).optional(),
  messageId: z.string().min(1).optional(),
  block: z.boolean().optional(),
});

export async function reportConversation(matchId: string, input: ReportInput) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { error: "Segnalazione non valida" };
  const { reason, messageId, block } = parsed.data;
  const details = parsed.data.details || null;
  const { user, convo } = ctx;

  try {
    if (messageId) {
      const [own] = await db
        .select({ id: chatMessages.id })
        .from(chatMessages)
        .where(and(eq(chatMessages.id, messageId), eq(chatMessages.matchId, matchId)));
      if (!own) return { error: "Messaggio non trovato" };
    }

    const [report] = await db
      .insert(chatReports)
      .values({ matchId, reporterId: user.id, messageId: messageId ?? null, reason, details })
      .returning({ id: chatReports.id });

    const to = process.env.CHAT_MODERATION_EMAIL;
    if (to) {
      const recent = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.matchId, matchId))
        .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
        .limit(20);
      const email = buildReportEmail({
        reportId: report.id,
        matchId,
        reason,
        details,
        reporter: { id: user.id, email: user.email, role: user.role },
        reportedMessageId: messageId ?? null,
        transcript: recent.reverse().map((m) => ({
          senderRole: m.senderId === convo.match.professionalId ? ("professional" as const) : ("company" as const),
          createdAt: m.createdAt.toISOString(),
          text: [m.body, m.attachmentName && `[allegato: ${m.attachmentName}]`].filter(Boolean).join(" "),
        })),
      });
      sendInBackground("chat report", [() => sendEmail({ to, ...email })]);
    } else {
      console.warn(`Chat report ${report.id} stored, but CHAT_MODERATION_EMAIL is not set: nobody was notified.`);
    }

    const blockedById = block ? await applyBlock(matchId, user.id, convo.otherUserId) : convo.match.blockedById;
    return { success: true as const, data: { reportId: report.id, blockedById } };
  } catch (error) {
    console.error("Error reporting conversation:", error);
    return { error: "Errore durante l'invio della segnalazione" };
  }
}

/**
 * Step one of sending a file: upload it as a private ("authenticated") Cloudinary resource
 * in this conversation's folder. sendMessage then references it by public id.
 */
export async function uploadChatAttachment(matchId: string, formData: FormData) {
  const ctx = await viewerConversation(matchId);
  if ("error" in ctx) return { error: ctx.error };
  if (ctx.convo.match.blockedById) return { error: "Questa conversazione è chiusa" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "File mancante" };
  if (!(ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Formato non supportato. Invia un'immagine (JPG, PNG, WebP, GIF) o un PDF." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) return { error: "File troppo grande. Massimo 5MB." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          // PDFs are "image" resources in Cloudinary too, so one resource type covers both
          { folder: chatFolder(matchId), type: "authenticated", resource_type: "image" },
          (error, res) => (error || !res ? reject(error ?? new Error("Empty Cloudinary response")) : resolve(res))
        )
        .end(buffer);
    });
    const data: UploadedAttachment = {
      publicId: result.public_id,
      name: file.name.slice(0, 200) || "allegato",
      mime: file.type as AttachmentMime,
      size: file.size,
    };
    return { success: true as const, data };
  } catch (error) {
    console.error("Cloudinary chat upload error:", error);
    return { error: "Errore durante il caricamento del file" };
  }
}
