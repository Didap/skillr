// The chat contract shared by server actions, Pusher payloads and client components.
// Keep this file free of server-only imports: client components import it.

export const MAX_BODY_LENGTH = 2000;
export const PAGE_SIZE = 50;
export const AFTER_LIMIT = 200;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] as const;
export type AttachmentMime = (typeof ATTACHMENT_MIME_TYPES)[number];

export function isAttachmentMime(type: string): type is AttachmentMime {
  return (ATTACHMENT_MIME_TYPES as readonly string[]).includes(type);
}

/** Why a file can't be sent as an attachment, or null when it can. */
export function attachmentError(file: { type: string; size: number }): string | null {
  if (!isAttachmentMime(file.type)) return "Formato non supportato. Invia un'immagine (JPG, PNG, WebP, GIF) o un PDF.";
  if (file.size > MAX_ATTACHMENT_BYTES) return "File troppo grande. Massimo 5MB.";
  return null;
}

export type MessageAttachment = { url: string; name: string; mime: string; size: number };

export type ChatMessage = {
  id: string;
  matchId: string;
  senderId: string;
  body: string | null;
  attachment: MessageAttachment | null;
  createdAt: string; // ISO
};

export type ThreadPage = {
  messages: ChatMessage[]; // oldest first
  hasMore: boolean; // older messages exist before the first one
  otherLastReadAt: string | null;
  blockedById: string | null;
};

/** What uploadChatAttachment returns and sendMessage takes. */
export type UploadedAttachment = { publicId: string; name: string; mime: AttachmentMime; size: number };

export type SendMessageInput = {
  clientId: string;
  body?: string;
  attachment?: UploadedAttachment;
  socketId?: string;
};

/** Per-match preview computed in SQL. */
export type ChatPreview = {
  lastMessage: { body: string | null; hasAttachment: boolean; fromMe: boolean } | null;
  unread: number;
};

/** What each /matches row carries about its conversation. */
export type ChatSummary = ChatPreview & { lastMessageAt: string | null; blocked: boolean };

export type ChatReportReason = "spam" | "harassment" | "inappropriate" | "scam" | "other";

export const CHAT_REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: "spam", label: "Spam o pubblicità" },
  { value: "harassment", label: "Molestie o insulti" },
  { value: "inappropriate", label: "Contenuti inappropriati" },
  { value: "scam", label: "Truffa o richiesta di denaro" },
  { value: "other", label: "Altro" },
];

export type ReportInput = {
  reason: ChatReportReason;
  details?: string;
  messageId?: string;
  block?: boolean;
};
