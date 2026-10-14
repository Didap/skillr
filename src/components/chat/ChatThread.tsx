"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDayLabel, formatMessageTime } from "@/lib/chat/format";
import type { ThreadPage } from "@/lib/chat/types";
import { ChatAttachment } from "./ChatAttachment";
import { ChatComposer } from "./ChatComposer";
import { ChatMenu } from "./ChatMenu";
import { useChatVisible } from "./ChatVisibility";
import { useChatThread, type ThreadMessage } from "./useChatThread";

interface ChatThreadProps {
  matchId: string;
  viewerId: string;
  otherName: string;
  initial: ThreadPage;
}

const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

export function ChatThread({ matchId, viewerId, otherName, initial }: ChatThreadProps) {
  const visible = useChatVisible();
  const thread = useChatThread({ matchId, viewerId, initial, visible });
  const listRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const prependFrom = useRef<number | null>(null);

  const onScroll = () => {
    const el = listRef.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // New messages scroll the reader down only if they were already at the bottom (or wrote
  // it); older pages keep the reader where they were.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prependFrom.current !== null) {
      el.scrollTop = el.scrollHeight - prependFrom.current;
      prependFrom.current = null;
      return;
    }
    if (atBottom.current || thread.messages.at(-1)?.senderId === viewerId) el.scrollTop = el.scrollHeight;
  }, [thread.messages, viewerId]);

  // A hidden thread has no height: land at the bottom when it is shown
  useEffect(() => {
    const el = listRef.current;
    if (visible && el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [visible]);

  const loadOlder = async () => {
    const el = listRef.current;
    if (el) prependFrom.current = el.scrollHeight - el.scrollTop;
    const added = await thread.loadOlder();
    if (added === 0) prependFrom.current = null;
  };

  const lastOwnSent = thread.messages.findLast((m) => m.senderId === viewerId && m.status === "sent");
  const blocked = thread.blockedById !== null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-viola/15 pl-4 pr-2">
        <h2 className="truncate text-body font-bold text-viola">Chat con {otherName}</h2>
        <ChatMenu
          matchId={matchId}
          viewerId={viewerId}
          otherName={otherName}
          blockedById={thread.blockedById}
          onBlockedChange={thread.setBlockedById}
        />
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-label={`Messaggi con ${otherName}`}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-4 py-4"
      >
        {thread.hasMore && (
          <div className="flex justify-center pb-4">
            <button
              type="button"
              onClick={() => void loadOlder()}
              disabled={thread.loadingOlder}
              className="pressable h-9 rounded-full bg-crema px-4 text-label font-semibold text-viola disabled:opacity-60"
            >
              {thread.loadingOlder ? "Caricamento…" : "Carica messaggi precedenti"}
            </button>
          </div>
        )}

        {thread.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-body font-bold text-viola">Rompi il ghiaccio.</p>
            <p className="mt-1 text-sm text-viola-500">Scrivi a {otherName}: è il primo messaggio della vostra chat.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {thread.messages.map((m, i) => {
                const previous = thread.messages[i - 1];
                return (
                  <Fragment key={m.clientId ?? m.id}>
                    {(!previous || !sameDay(previous.createdAt, m.createdAt)) && (
                      <li className="self-center py-2 text-label font-semibold text-viola-500 first-letter:uppercase">
                        {formatDayLabel(new Date(m.createdAt))}
                      </li>
                    )}
                    <MessageBubble
                      message={m}
                      mine={m.senderId === viewerId}
                      receipt={
                        m === lastOwnSent
                          ? thread.otherLastReadAt && thread.otherLastReadAt >= m.createdAt
                            ? "Letto"
                            : "Inviato"
                          : null
                      }
                      onRetry={() => thread.retry(m.clientId!)}
                      onDiscard={() => thread.discard(m.clientId!)}
                    />
                  </Fragment>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
      </div>

      <p aria-live="polite" className="h-5 shrink-0 px-4 text-label text-viola-500">
        {thread.otherTyping && !blocked ? `${otherName} sta scrivendo…` : ""}
      </p>

      {blocked ? (
        <div className="shrink-0 border-t border-viola/15 bg-crema px-4 py-4 text-center text-sm text-viola">
          <p className="font-bold">Conversazione chiusa</p>
          <p className="text-viola-500">
            {thread.blockedById === viewerId
              ? "L'hai bloccata tu: puoi sbloccarla dal menu ⋯."
              : "Non è più possibile scrivere in questa chat."}
          </p>
        </div>
      ) : (
        <ChatComposer recipientName={otherName} onSend={thread.send} onTyping={thread.notifyTyping} />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  receipt,
  onRetry,
  onDiscard,
}: {
  message: ThreadMessage;
  mine: boolean;
  receipt: "Letto" | "Inviato" | null;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 480, damping: 32 }}
      className={cn("flex max-w-[85%] flex-col gap-1", mine ? "self-end items-end origin-bottom-right" : "self-start items-start origin-bottom-left")}
    >
      <div
        className={cn(
          "min-w-0 max-w-full rounded-3xl px-4 py-2.5 text-body",
          mine ? "rounded-br-md bg-viola text-white" : "rounded-bl-md bg-crema text-viola",
          message.status === "failed" && "opacity-60"
        )}
      >
        {message.attachment && <ChatAttachment attachment={message.attachment} mine={mine} />}
        {message.body && (
          <p className={cn("whitespace-pre-wrap break-words", message.attachment && "mt-2")}>{message.body}</p>
        )}
      </div>
      <p className="px-1 text-[11px] text-viola-400 tabular-nums">
        {message.status === "sending" && "Invio…"}
        {message.status === "sent" && (
          <>
            <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
            {receipt && <span className={cn(receipt === "Letto" && "text-viola font-semibold")}> · {receipt}</span>}
          </>
        )}
      </p>
      {message.status === "failed" && (
        <p className="flex flex-wrap items-center justify-end gap-x-3 px-1 text-label text-rosso-700">
          <span>Non inviato{message.error ? `: ${message.error}` : ""}</span>
          <button type="button" onClick={onRetry} className="font-bold underline underline-offset-2">Riprova</button>
          <button type="button" onClick={onDiscard} className="text-viola-500 underline underline-offset-2">Elimina</button>
        </p>
      )}
    </motion.li>
  );
}
