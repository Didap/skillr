import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: "v3", auth });

// Without the service account credentials every call fails: callers check this
// up front so a company that picks Google Meet gets an error instead of no link.
export function isGoogleCalendarConfigured() {
  // A real service-account key is a PEM block; .env.example ships placeholder text,
  // which would otherwise pass here and only fail when the professional confirms.
  return Boolean(clientEmail && privateKey?.includes("-----BEGIN PRIVATE KEY-----"));
}

export async function createMeetEvent(
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendees: string[] = []
) {
  if (!isGoogleCalendarConfigured()) {
    return { success: false as const, error: "Google Calendar non configurato" };
  }

  try {
    const event = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Europe/Rome",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Europe/Rome",
      },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const eventId = response.data.id;
    const meetingLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri;

    // An event without a conference is useless to us: drop it rather than keep an orphan.
    if (!eventId || !meetingLink) {
      if (eventId) await deleteMeetEvent(eventId);
      return { success: false as const, error: "Link Google Meet non generato" };
    }

    return { success: true as const, eventId, meetingLink };
  } catch (error) {
    console.error("Google Calendar Error:", error);
    return { success: false as const, error };
  }
}

export async function deleteMeetEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return { success: true };
  } catch (error) {
    console.error("Google Calendar Delete Error:", error);
    return { success: false, error };
  }
}
