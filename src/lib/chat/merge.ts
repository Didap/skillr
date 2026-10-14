import type { ChatMessage, UploadedAttachment } from "./types";

export type OutgoingDraft = { body: string; file: File | null; uploaded?: UploadedAttachment };

export type ThreadMessage = ChatMessage & {
  /** Set on messages written in this tab: the render key, stable from optimistic to confirmed */
  clientId?: string;
  status: "sent" | "sending" | "failed";
  error?: string;
  /** What to resend on "Riprova" */
  draft?: OutgoingDraft;
};

const chronological = (a: ChatMessage, b: ChatMessage) =>
  a.createdAt === b.createdAt ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.createdAt < b.createdAt ? -1 : 1;

/**
 * One list from every source (server pages, Pusher events, catch-up fetches): server
 * messages deduped by id in chronological order, then the ones still being sent.
 */
export function mergeMessages(prev: ThreadMessage[], incoming: ChatMessage[]): ThreadMessage[] {
  const sent = new Map<string, ThreadMessage>();
  const pending: ThreadMessage[] = [];
  for (const m of prev) {
    if (m.status === "sent") sent.set(m.id, m);
    else pending.push(m);
  }
  for (const m of incoming) {
    sent.set(m.id, { ...m, status: "sent", clientId: sent.get(m.id)?.clientId });
  }
  return [...[...sent.values()].sort(chronological), ...pending];
}

/** The server accepted an optimistic message: swap it for the stored one. */
export function confirmPending(prev: ThreadMessage[], clientId: string, message: ChatMessage): ThreadMessage[] {
  const rest = prev.filter((m) => m.status === "sent" || m.clientId !== clientId);
  return mergeMessages(rest, [message]).map((m) => (m.id === message.id ? { ...m, clientId } : m));
}
