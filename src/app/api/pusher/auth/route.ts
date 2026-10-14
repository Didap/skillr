import { auth } from "@/auth";
import { loadConversation } from "@/lib/chat/access";
import { parseChannel } from "@/lib/chat/channels";
import { getPusher } from "@/lib/pusher/server";

/**
 * pusher-js asks here before joining a private channel. A user channel is yours alone;
 * a match channel needs the same access as the chat itself.
 */
export async function POST(request: Request) {
  const pusher = getPusher();
  if (!pusher) return new Response("Realtime non configurato", { status: 503 });

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Non autorizzato", { status: 401 });

  const form = await request.formData().catch(() => null);
  const socketId = form?.get("socket_id");
  const channelName = form?.get("channel_name");
  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return new Response("Richiesta non valida", { status: 400 });
  }

  const channel = parseChannel(channelName);
  const allowed =
    channel?.kind === "user"
      ? channel.id === userId
      : channel?.kind === "match"
        ? !("error" in (await loadConversation(channel.id, userId)))
        : false;
  if (!allowed) return new Response("Non autorizzato", { status: 403 });

  try {
    return Response.json(pusher.authorizeChannel(socketId, channelName));
  } catch {
    // authorizeChannel throws on a malformed socket id
    return new Response("Richiesta non valida", { status: 400 });
  }
}
