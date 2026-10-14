"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { ATTACHMENT_MIME_TYPES, attachmentError, MAX_BODY_LENGTH } from "@/lib/chat/types";
import { formatBytes } from "@/lib/chat/format";
import type { OutgoingDraft } from "@/lib/chat/merge";

interface ChatComposerProps {
  recipientName: string;
  onSend: (draft: OutgoingDraft) => void;
  onTyping: () => void;
}

export function ChatComposer({ recipientName, onSend, onTyping }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = text.trim().length > 0 || file !== null;

  const resize = () => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend({ body: text, file });
    setText("");
    setFile(null);
    requestAnimationFrame(resize);
    textRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter is a new line; never while an IME is composing
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const pick = (picked: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!picked) return;
    const invalid = attachmentError(picked);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setFile(picked);
  };

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-viola/15 bg-white px-3 py-3">
      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-full bg-crema pl-4 pr-1 h-10 text-sm text-viola">
          <Paperclip size={16} aria-hidden="true" className="shrink-0" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-label text-viola-500 shrink-0">{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            aria-label="Rimuovi allegato"
            className="pressable size-8 rounded-full flex items-center justify-center hover:bg-white shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ATTACHMENT_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Allega un file"
          className="pressable size-11 shrink-0 rounded-full flex items-center justify-center text-viola hover:bg-crema"
        >
          <Paperclip size={22} strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0 rounded-3xl bg-crema px-4 py-2.5 focus-within:ring-3 focus-within:ring-ring/50">
          <textarea
            ref={textRef}
            rows={1}
            value={text}
            maxLength={MAX_BODY_LENGTH}
            onChange={(e) => {
              setText(e.target.value);
              resize();
              onTyping();
            }}
            onKeyDown={onKeyDown}
            placeholder={`Scrivi a ${recipientName}…`}
            aria-label={`Scrivi a ${recipientName}`}
            enterKeyHint="send"
            className="block w-full resize-none bg-transparent text-body text-viola placeholder:text-viola-400 outline-none max-h-40"
          />
          {text.length > MAX_BODY_LENGTH - 200 && (
            <p className="text-right text-label text-viola-500 tabular-nums">{text.length}/{MAX_BODY_LENGTH}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Invia"
          className="pressable size-11 shrink-0 rounded-full bg-viola text-white flex items-center justify-center disabled:bg-viola/40 disabled:cursor-not-allowed"
        >
          <ArrowUp size={20} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
