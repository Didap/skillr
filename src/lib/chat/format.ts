import { format, isSameYear } from "date-fns";
import { it } from "date-fns/locale";
import type { ChatPreview } from "./types";

/** Inbox column: "09:05", "Ieri", "3 mar", "31/12/25". */
export function formatChatTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (isSameDay(date, now)) return format(date, "HH:mm");
  if (isSameDay(date, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "Ieri";
  if (isSameYear(date, now)) return format(date, "d MMM", { locale: it });
  return format(date, "dd/MM/yy");
}

/** Separator between days in the thread: "Oggi", "Ieri", "lunedì 5 ottobre". */
export function formatDayLabel(date: Date, now = new Date()) {
  if (isSameDay(date, now)) return "Oggi";
  if (isSameDay(date, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "Ieri";
  return format(date, isSameYear(date, now) ? "EEEE d MMMM" : "EEEE d MMMM yyyy", { locale: it });
}

export const formatMessageTime = (iso: string) => format(new Date(iso), "HH:mm");

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function previewText(last: NonNullable<ChatPreview["lastMessage"]>) {
  const text = last.body ?? (last.hasAttachment ? "📎 Allegato" : "");
  return last.fromMe ? `Tu: ${text}` : text;
}

// Takes `now` instead of date-fns' isToday/isYesterday (which read the clock), so one
// render uses one "now" and the helpers can be tested.
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
