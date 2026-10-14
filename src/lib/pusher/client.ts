"use client";

import Pusher from "pusher-js";

let client: Pusher | null | undefined;

/** One connection per tab, or null without the public env vars (the chat then polls). */
export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  client = key && cluster
    ? new Pusher(key, { cluster, channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" } })
    : null;
  return client;
}

/** Sent with writes so the server skips echoing them back to this tab. */
export function currentSocketId(): string | undefined {
  return client?.connection.socket_id || undefined;
}
