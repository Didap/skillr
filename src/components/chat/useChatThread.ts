"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "pusher-js";
import { getMessages, markRead, sendMessage, uploadChatAttachment } from "@/app/actions/chat";
import { CHAT_EVENTS, matchChannel } from "@/lib/chat/channels";
import { confirmPending, mergeMessages, type OutgoingDraft, type ThreadMessage } from "@/lib/chat/merge";
import type { ChatMessage, ThreadPage } from "@/lib/chat/types";
import { currentSocketId, getPusherClient } from "@/lib/pusher/client";

export type { OutgoingDraft, ThreadMessage };

const POLL_MS = 10_000;
const TYPING_THROTTLE_MS = 3_000;
const TYPING_TTL_MS = 5_000;
const OFFLINE = "Connessione assente. Riprova.";

interface Options {
  matchId: string;
  viewerId: string;
  initial: ThreadPage;
  /** The thread is on screen (not behind the "Dettagli" tab) */
  visible: boolean;
}

/**
 * State of one conversation: server pages, Pusher events, optimistic sends and the
 * polling fallback, merged into one list. The DB stays the source of truth: any doubt
 * (reconnect, tab back in view, failed send) is resolved by fetching what's newer.
 */
export function useChatThread({ matchId, viewerId, initial, visible }: Options) {
  const [messages, setMessages] = useState<ThreadMessage[]>(() => mergeMessages([], initial.messages));
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState(initial.otherLastReadAt);
  const [blockedById, setBlockedById] = useState(initial.blockedById);
  const [otherTyping, setOtherTyping] = useState(false);
  const [live, setLive] = useState(false);

  const messagesRef = useRef(messages);
  const visibleRef = useRef(visible);
  const channelRef = useRef<Channel | null>(null);
  const typingTimer = useRef<number | undefined>(undefined);
  const readTimer = useRef<number | undefined>(undefined);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // Debounced: a burst of incoming messages costs one write
  const scheduleRead = useCallback(() => {
    if (!visibleRef.current || document.visibilityState !== "visible") return;
    window.clearTimeout(readTimer.current);
    readTimer.current = window.setTimeout(() => {
      void markRead(matchId, currentSocketId()).catch(() => {});
    }, 300);
  }, [matchId]);

  const catchUp = useCallback(async () => {
    const after = messagesRef.current.findLast((m) => m.status === "sent")?.id;
    const res = await getMessages(matchId, after ? { after } : {}).catch(() => null);
    if (!res || "error" in res) return;
    const { messages: fresh } = res.data;
    if (fresh.length > 0) setMessages((prev) => mergeMessages(prev, fresh));
    setOtherLastReadAt(res.data.otherLastReadAt);
    setBlockedById(res.data.blockedById);
    if (fresh.some((m) => m.senderId !== viewerId)) scheduleRead();
  }, [matchId, viewerId, scheduleRead]);

  // Realtime
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const name = matchChannel(matchId);
    const channel = pusher.subscribe(name);
    channelRef.current = channel;

    // Anything sent between the server render and now (or while disconnected) is fetched
    channel.bind("pusher:subscription_succeeded", () => {
      setLive(true);
      void catchUp();
    });
    channel.bind("pusher:subscription_error", () => setLive(false));
    channel.bind(CHAT_EVENTS.newMessage, (message: ChatMessage) => {
      setMessages((prev) => mergeMessages(prev, [message]));
      if (message.senderId !== viewerId) {
        setOtherTyping(false);
        scheduleRead();
      }
    });
    channel.bind(CHAT_EVENTS.read, (e: { userId: string; readAt: string }) => {
      if (e.userId !== viewerId) setOtherLastReadAt(e.readAt);
    });
    channel.bind(CHAT_EVENTS.blocked, (e: { blockedById: string }) => setBlockedById(e.blockedById));
    channel.bind(CHAT_EVENTS.unblocked, () => setBlockedById(null));
    channel.bind(CHAT_EVENTS.typing, (e: { userId: string }) => {
      if (e.userId === viewerId) return;
      setOtherTyping(true);
      window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => setOtherTyping(false), TYPING_TTL_MS);
    });

    const onState = ({ current }: { current: string }) => {
      setLive(current === "connected" && channel.subscribed);
      if (current === "connected") void catchUp();
    };
    pusher.connection.bind("state_change", onState);

    return () => {
      pusher.connection.unbind("state_change", onState);
      channel.unbind_all();
      pusher.unsubscribe(name);
      channelRef.current = null;
      window.clearTimeout(typingTimer.current);
    };
  }, [matchId, viewerId, catchUp, scheduleRead]);

  // Polling fallback while realtime is unavailable
  useEffect(() => {
    if (live) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void catchUp();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [live, catchUp]);

  // Back to the tab: catch up and read
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void catchUp();
      scheduleRead();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [catchUp, scheduleRead]);

  // Opening the thread (or switching to the Chat tab) reads it
  useEffect(() => {
    if (visible) scheduleRead();
  }, [visible, scheduleRead]);

  useEffect(() => () => window.clearTimeout(readTimer.current), []);

  const fail = useCallback((clientId: string, error: string) => {
    setMessages((prev) =>
      prev.map((m): ThreadMessage => (m.clientId === clientId && m.status !== "sent" ? { ...m, status: "failed", error } : m))
    );
  }, []);

  const deliver = useCallback(
    async (clientId: string, draft: OutgoingDraft) => {
      let attachment = draft.uploaded;
      if (draft.file && !attachment) {
        const form = new FormData();
        form.append("file", draft.file);
        const upload = await uploadChatAttachment(matchId, form).catch(() => ({ error: OFFLINE }));
        if ("error" in upload) return fail(clientId, upload.error ?? OFFLINE);
        attachment = upload.data;
        const uploaded = attachment;
        // "Riprova" reuses the upload
        setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, draft: { ...draft, uploaded } } : m)));
      }
      const res = await sendMessage(matchId, { clientId, body: draft.body, attachment, socketId: currentSocketId() }).catch(
        () => ({ error: OFFLINE })
      );
      if ("error" in res) {
        fail(clientId, res.error ?? OFFLINE);
        // e.g. the conversation was just closed: pick up the new state
        void catchUp();
        return;
      }
      setMessages((prev) => confirmPending(prev, clientId, res.data.message));
    },
    [matchId, fail, catchUp]
  );

  const send = useCallback(
    (draft: OutgoingDraft) => {
      const clientId = crypto.randomUUID();
      const optimistic: ThreadMessage = {
        id: clientId,
        clientId,
        matchId,
        senderId: viewerId,
        body: draft.body.trim() || null,
        attachment: draft.file ? { url: "", name: draft.file.name, mime: draft.file.type, size: draft.file.size } : null,
        createdAt: new Date().toISOString(),
        status: "sending",
        draft,
      };
      setMessages((prev) => [...prev, optimistic]);
      void deliver(clientId, draft);
    },
    [matchId, viewerId, deliver]
  );

  const retry = useCallback(
    (clientId: string) => {
      const message = messagesRef.current.find((m) => m.clientId === clientId && m.status === "failed");
      if (!message?.draft) return;
      setMessages((prev) => prev.map((m): ThreadMessage => (m === message ? { ...m, status: "sending", error: undefined } : m)));
      void deliver(clientId, message.draft);
    },
    [deliver]
  );

  const discard = useCallback((clientId: string) => {
    setMessages((prev) => prev.filter((m) => m.status === "sent" || m.clientId !== clientId));
  }, []);

  const notifyTyping = useCallback(() => {
    const channel = channelRef.current;
    const now = Date.now();
    if (!channel?.subscribed || now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = now;
    channel.trigger(CHAT_EVENTS.typing, { userId: viewerId });
  }, [viewerId]);

  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current.find((m) => m.status === "sent")?.id;
    if (!oldest || loadingOlder) return 0;
    setLoadingOlder(true);
    const res = await getMessages(matchId, { before: oldest }).catch(() => null);
    setLoadingOlder(false);
    if (!res || "error" in res) return 0;
    setMessages((prev) => mergeMessages(prev, res.data.messages));
    setHasMore(res.data.hasMore);
    return res.data.messages.length;
  }, [matchId, loadingOlder]);

  return {
    messages, hasMore, loadingOlder, loadOlder,
    otherLastReadAt, blockedById, setBlockedById,
    otherTyping, live,
    send, retry, discard, notifyTyping,
  };
}
