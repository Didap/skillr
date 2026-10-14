import Pusher from "pusher";

let client: Pusher | null | undefined;

/** Server SDK, or null when the Pusher env vars are missing (the chat then polls). */
export function getPusher(): Pusher | null {
  if (client !== undefined) return client;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  client = appId && key && secret && cluster ? new Pusher({ appId, key, secret, cluster, useTLS: true }) : null;
  return client;
}

/**
 * Notifies subscribers after a DB write. The write is the source of truth, so a Pusher
 * outage is logged and never fails the caller. `socketId` skips the sender's own tab.
 */
export async function publish(channels: string | string[], event: string, data: unknown, socketId?: string) {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(channels, event, data, socketId ? { socket_id: socketId } : undefined);
  } catch (error) {
    console.error(`Pusher trigger failed (${event}):`, error);
  }
}
