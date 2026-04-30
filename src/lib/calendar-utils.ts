
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
