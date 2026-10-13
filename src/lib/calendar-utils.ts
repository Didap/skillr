
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

// Smart Interview events without an explicit end are treated as one hour long.
export const SMART_EVENT_DEFAULT_DURATION_MS = 60 * 60_000;

/** End of a Smart Interview: its saved end time, or start + one hour. */
export function smartEventEnd(event: { date: Date | string; startTime?: Date | string | null; endTime?: Date | string | null }) {
  if (event.endTime) return new Date(event.endTime);
  return new Date(new Date(event.startTime ?? event.date).getTime() + SMART_EVENT_DEFAULT_DURATION_MS);
}

// The meeting button opens 5 minutes early and stays available for an hour after the
// start (or until the end, if later), in case the call runs long.
export const JOIN_OPENS_BEFORE_MS = 5 * 60_000;
export const JOIN_AVAILABLE_FOR_MS = 60 * 60_000;

export function joinWindow(start: Date | string, end?: Date | string | null) {
  const startMs = new Date(start).getTime();
  const opensAt = startMs - JOIN_OPENS_BEFORE_MS;
  const closesAt = Math.max(end ? new Date(end).getTime() : 0, startMs + JOIN_AVAILABLE_FOR_MS);
  return { opensAt, closesAt };
}

/** "upcoming" before the window opens, "open" while joinable, "over" afterwards. */
export function joinState(start: Date | string, end?: Date | string | null, now = Date.now()) {
  const { opensAt, closesAt } = joinWindow(start, end);
  if (now < opensAt) return "upcoming" as const;
  if (now <= closesAt) return "open" as const;
  return "over" as const;
}
