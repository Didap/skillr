
/**
 * Generates a simple RFC 5545 compliant ICS string for a calendar event.
 */
export function generateIcsString(options: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  uid?: string;
}) {
  const { title, description, startTime, endTime, location, uid } = options;

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const escapedDescription = description.replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skillr//NONSGML Event//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid || crypto.randomUUID()}@skillr.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${escapedDescription}`,
    location ? `LOCATION:${location}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// Calls booked through a match always last 30 minutes; reviews unlock when they end.
export const CALL_DURATION_MINUTES = 30;
export const CALL_DURATION_MS = CALL_DURATION_MINUTES * 60_000;

// Skillr runs on Italian time: slots are entered and displayed in this zone whatever
// the browser or the server (often UTC) is set to.
export const MEETING_TIME_ZONE = "Europe/Rome";

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Turns the calendar day picked in the UI plus an "HH:MM" string into the instant
 * that wall-clock time represents in Italy (handles the DST switch).
 */
export function romeDateTimeToDate(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const guess = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  const firstOffset = timeZoneOffsetMs(new Date(guess), MEETING_TIME_ZONE);
  let result = guess - firstOffset;
  const secondOffset = timeZoneOffsetMs(new Date(result), MEETING_TIME_ZONE);
  if (secondOffset !== firstOffset) result = guess - secondOffset;
  return new Date(result);
}

export function formatRomeDate(date: Date | string, options: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleString("it-IT", { ...options, timeZone: MEETING_TIME_ZONE });
}

/**
 * Normalizes a meeting link typed by a company: adds https:// when the scheme is
 * missing (otherwise the browser treats it as a relative path) and only accepts
 * absolute http(s) URLs. Returns null when the input is not a usable link.
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
