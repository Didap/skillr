import type { chatMessages } from "@/db/schema";
import type { ChatMessage } from "./types";
import { signedAttachmentUrl } from "./attachments";

export type ChatMessageRow = typeof chatMessages.$inferSelect;

export function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    matchId: row.matchId,
    senderId: row.senderId,
    body: row.body,
    attachment:
      row.attachmentPublicId && row.attachmentMime
        ? {
            url: signedAttachmentUrl(row.attachmentPublicId, row.attachmentMime),
            name: row.attachmentName ?? "Allegato",
            mime: row.attachmentMime,
            size: row.attachmentSize ?? 0,
          }
        : null,
    createdAt: row.createdAt.toISOString(),
  };
}
