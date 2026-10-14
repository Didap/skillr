"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getUnreadTotal } from "@/app/actions/chat";
import { CHAT_EVENTS, userChannel } from "@/lib/chat/channels";
import { getPusherClient } from "@/lib/pusher/client";

type InboxListener = () => void;

interface ChatRealtime {
  unreadTotal: number;
  /** Called when any of your conversations changes (or a fallback poll sees a new unread total) */
  onInboxUpdate: (listener: InboxListener) => () => void;
}

const ChatRealtimeContext = createContext<ChatRealtime>({
  unreadTotal: 0,
  onInboxUpdate: () => () => {},
});

const FALLBACK_POLL_MS = 60_000;

/** One subscription to your user channel for the whole app: nav badges and the inbox. */
export function ChatRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [unreadTotal, setUnreadTotal] = useState(0);
  const listeners = useRef(new Set<InboxListener>());
  const latestRequest = useRef(0);
  const lastTotal = useRef(0);

  // Resolves to whether the total changed; out-of-order answers are dropped
  const fetchUnread = useCallback(async () => {
    const request = ++latestRequest.current;
    const res = await getUnreadTotal().catch(() => null);
    if (!res || "error" in res || request !== latestRequest.current) return false;
    const changed = res.data !== lastTotal.current;
    lastTotal.current = res.data;
    setUnreadTotal(res.data);
    return changed;
  }, []);

  useEffect(() => {
    if (!userId) return;
    void fetchUnread();
    const notify = () => listeners.current.forEach((listener) => listener());

    const pusher = getPusherClient();
    const name = userChannel(userId);
    const channel = pusher?.subscribe(name);
    const onInbox = () => {
      void fetchUnread();
      notify();
    };
    channel?.bind(CHAT_EVENTS.inbox, onInbox);

    // Without realtime the badge (and an open inbox) still catch up, just more slowly
    const poll = window.setInterval(async () => {
      if (document.visibilityState === "visible" && (await fetchUnread())) notify();
    }, FALLBACK_POLL_MS);

    return () => {
      window.clearInterval(poll);
      channel?.unbind(CHAT_EVENTS.inbox, onInbox);
      pusher?.unsubscribe(name);
    };
  }, [userId, fetchUnread]);

  const onInboxUpdate = useCallback((listener: InboxListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({ unreadTotal, onInboxUpdate }), [unreadTotal, onInboxUpdate]);
  return <ChatRealtimeContext.Provider value={value}>{children}</ChatRealtimeContext.Provider>;
}

export const useChatRealtime = () => useContext(ChatRealtimeContext);
