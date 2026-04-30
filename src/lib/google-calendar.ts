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

export async function createMeetEvent(
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendees: string[] = []
) {
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

    return {
      success: true,
      eventId: response.data.id,
      meetingLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
    };
  } catch (error) {
    console.error("Google Calendar Error:", error);
    return { success: false, error };
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
