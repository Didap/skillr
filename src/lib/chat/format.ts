import { formatEventTime, formatRomeDate, getRomeWallTime } from "@/lib/rome-time";
import type { ChatPreview } from "./types";

// Everything is Europe/Rome, never the runtime's zone: the thread is server-rendered (UTC in
// production) and hydrated in an Italian browser, so both must print the same text.
const romeDay = (value: Date | string) => {
  const { year, month, day } = getRomeWallTime(value);
  return { year, month, day, key: year * 10000 + month * 100 + day };
};

/** Same calendar day in Italian time. */
export function isSameRomeDay(a: Date | string, b: Date | string) {
  return romeDay(a).key === romeDay(b).key;
}

// Takes `now` instead of reading the clock, so one render uses one "now" and the helpers can be tested.
function relativeDay(date: Date, now: Date): "today" | "yesterday" | "year" | "older" {
  const d = romeDay(date);
  const n = romeDay(now);
  if (d.key === n.key) return "today";
  // Date.UTC normalizes day 0 to the last day of the previous month
  const y = new Date(Date.UTC(n.year, n.month - 1, n.day - 1));
  if (d.key === y.getUTCFullYear() * 10000 + (y.getUTCMonth() + 1) * 100 + y.getUTCDate()) return "yesterday";
  return d.year === n.year ? "year" : "older";
}

/** Inbox column: "09:05", "Ieri", "3 mar", "31/12/25". */
export function formatChatTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  switch (relativeDay(date, now)) {
    case "today": return formatEventTime(date);
    case "yesterday": return "Ieri";
    case "year": return formatRomeDate(date, { day: "numeric", month: "short" });
    default: return formatRomeDate(date, { day: "2-digit", month: "2-digit", year: "2-digit" });
  }
}

/** Separator between days in the thread: "Oggi", "Ieri", "lunedì 5 ottobre". */
export function formatDayLabel(date: Date, now = new Date()) {
  const rel = relativeDay(date, now);
  if (rel === "today") return "Oggi";
  if (rel === "yesterday") return "Ieri";
  return formatRomeDate(date, {
    weekday: "long", day: "numeric", month: "long",
    ...(rel === "older" ? { year: "numeric" as const } : {}),
  });
}

export const formatMessageTime = (iso: string) => formatEventTime(iso);

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function previewText(last: NonNullable<ChatPreview["lastMessage"]>) {
  const text = last.body ?? (last.hasAttachment ? "📎 Allegato" : "");
  return last.fromMe ? `Tu: ${text}` : text;
}
