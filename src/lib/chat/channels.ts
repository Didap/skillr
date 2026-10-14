export const matchChannel = (matchId: string) => `private-match-${matchId}`;
export const userChannel = (userId: string) => `private-user-${userId}`;

export function parseChannel(name: string): { kind: "match" | "user"; id: string } | null {
  const found = /^private-(match|user)-(.+)$/.exec(name);
  return found ? { kind: found[1] as "match" | "user", id: found[2] } : null;
}

export const CHAT_EVENTS = {
  newMessage: "message:new",
  read: "message:read",
  blocked: "conversation:blocked",
  unblocked: "conversation:unblocked",
  inbox: "inbox:update",
  // Client events must start with "client-" and need "Enable client events" in the Pusher app
  typing: "client-typing",
} as const;
