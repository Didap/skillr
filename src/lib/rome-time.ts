// Skillr runs on Italian time: call slots and Smart Interview events are entered and shown in
// Europe/Rome whatever the browser or the server (often UTC) is set to. Plain Intl, no tz library.
export const ROME_TIME_ZONE = "Europe/Rome";

type DateInput = Date | string | number;

const formatters = {
  day: new Intl.DateTimeFormat("it-IT", { timeZone: ROME_TIME_ZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  dayShort: new Intl.DateTimeFormat("it-IT", { timeZone: ROME_TIME_ZONE, day: "numeric", month: "short" }),
  time: new Intl.DateTimeFormat("it-IT", { timeZone: ROME_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  month: new Intl.DateTimeFormat("it-IT", { timeZone: ROME_TIME_ZONE, month: "short" }),
  dayOfMonth: new Intl.DateTimeFormat("it-IT", { timeZone: ROME_TIME_ZONE, day: "numeric" }),
  parts: new Intl.DateTimeFormat("en-US", {
    timeZone: ROME_TIME_ZONE,
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", hourCycle: "h23",
  }),
};

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

/** "lunedì 12 ottobre 2026" */
export const formatEventDay = (value: DateInput) => formatters.day.format(toDate(value));
/** "12 ott" */
export const formatEventDayShort = (value: DateInput) => formatters.dayShort.format(toDate(value));
/** "14:30" */
export const formatEventTime = (value: DateInput) => formatters.time.format(toDate(value));
/** "ott" */
export const formatEventMonth = (value: DateInput) => formatters.month.format(toDate(value));
/** "12" */
export const formatEventDayOfMonth = (value: DateInput) => formatters.dayOfMonth.format(toDate(value));
/** "lunedì 12 ottobre 2026 alle 14:30" */
export const formatEventDateTime = (value: DateInput) => `${formatEventDay(value)} alle ${formatEventTime(value)}`;

/** Any other Italian-time format, e.g. formatRomeDate(d, { weekday: "short" }). */
export function formatRomeDate(value: DateInput, options: Intl.DateTimeFormatOptions) {
  return toDate(value).toLocaleString("it-IT", { ...options, timeZone: ROME_TIME_ZONE });
}

/** Wall-clock components of an instant in Italian time (month is 1-12). */
export function getRomeWallTime(value: DateInput) {
  const parts = Object.fromEntries(
    formatters.parts.formatToParts(toDate(value)).map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

// Offset of Italian time from UTC at a given instant, in ms (+1h in winter, +2h in summer).
function offsetAt(utcMs: number) {
  const w = getRomeWallTime(utcMs);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute) - Math.floor(utcMs / 60000) * 60000;
}

/** The instant at which it is the given wall-clock time in Italy (month is 1-12). */
export function romeWallTimeToDate(year: number, month: number, day: number, hour: number, minute: number) {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Second pass corrects the guess when the first one lands across a DST switch.
  const first = asUtc - offsetAt(asUtc);
  return new Date(asUtc - offsetAt(first));
}

/** A calendar day picked in the UI plus "HH:MM", read as Italian time. */
export function romeDateTimeToDate(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  return romeWallTimeToDate(day.getFullYear(), day.getMonth() + 1, day.getDate(), h, m);
}

/**
 * Normalizes a meeting link typed by a company: adds https:// when the scheme is missing
 * (otherwise the browser treats it as a relative path) and only accepts absolute http(s)
 * URLs with a dotted host. Returns null when the input is not a usable link.
 */
export function normalizeMeetingUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Render guard: only http(s) links become clickable (no javascript: and friends). */
export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
