import { google } from "googleapis";
import { prisma } from "@/lib/db";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getAuthenticatedClient() {
  const client = getOAuth2Client();

  const accessToken = await prisma.bookingSetting.findUnique({
    where: { key: "google_access_token" },
  });
  const refreshToken = await prisma.bookingSetting.findUnique({
    where: { key: "google_refresh_token" },
  });
  const tokenExpiry = await prisma.bookingSetting.findUnique({
    where: { key: "google_token_expiry" },
  });

  if (!accessToken || !refreshToken) return null;

  client.setCredentials({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
    expiry_date: tokenExpiry ? parseInt(tokenExpiry.value) : undefined,
  });

  // Refresh if expired
  if (tokenExpiry && parseInt(tokenExpiry.value) < Date.now()) {
    const { credentials } = await client.refreshAccessToken();
    await prisma.bookingSetting.upsert({
      where: { key: "google_access_token" },
      update: { value: credentials.access_token || "" },
      create: { key: "google_access_token", value: credentials.access_token || "" },
    });
    if (credentials.expiry_date) {
      await prisma.bookingSetting.upsert({
        where: { key: "google_token_expiry" },
        update: { value: credentials.expiry_date.toString() },
        create: { key: "google_token_expiry", value: credentials.expiry_date.toString() },
      });
    }
  }

  return client;
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  await prisma.bookingSetting.upsert({
    where: { key: "google_access_token" },
    update: { value: tokens.access_token || "" },
    create: { key: "google_access_token", value: tokens.access_token || "" },
  });
  await prisma.bookingSetting.upsert({
    where: { key: "google_refresh_token" },
    update: { value: tokens.refresh_token || "" },
    create: { key: "google_refresh_token", value: tokens.refresh_token || "" },
  });
  if (tokens.expiry_date) {
    await prisma.bookingSetting.upsert({
      where: { key: "google_token_expiry" },
      update: { value: tokens.expiry_date.toString() },
      create: { key: "google_token_expiry", value: tokens.expiry_date.toString() },
    });
  }
}

export async function createEvent(appointment: {
  clientName: string;
  clientEmail: string;
  date: Date;
  startTime: string;
  endTime: string;
  service: { name: string; emoji: string; durationMinutes: number };
}): Promise<string | null> {
  const client = await getAuthenticatedClient();
  if (!client) return null;

  const calendarId = await prisma.bookingSetting.findUnique({
    where: { key: "google_calendar_id" },
  });

  const calendar = google.calendar({ version: "v3", auth: client });
  const dateStr = appointment.date.toISOString().split("T")[0];

  const event = await calendar.events.insert({
    calendarId: calendarId?.value || "primary",
    requestBody: {
      summary: `${appointment.service.emoji} ${appointment.service.name} - ${appointment.clientName}`,
      description: `Client: ${appointment.clientName}\nEmail: ${appointment.clientEmail}`,
      start: {
        dateTime: `${dateStr}T${appointment.startTime}:00`,
        timeZone: process.env.TIMEZONE || "America/Toronto",
      },
      end: {
        dateTime: `${dateStr}T${appointment.endTime}:00`,
        timeZone: process.env.TIMEZONE || "America/Toronto",
      },
    },
  });

  return event.data.id || null;
}

export async function deleteEvent(googleEventId: string) {
  const client = await getAuthenticatedClient();
  if (!client) return;

  const calendarId = await prisma.bookingSetting.findUnique({
    where: { key: "google_calendar_id" },
  });

  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.delete({
    calendarId: calendarId?.value || "primary",
    eventId: googleEventId,
  });
}

export async function getExternalEvents(
  dateStr: string
): Promise<{ start: string; end: string }[]> {
  const client = await getAuthenticatedClient();
  if (!client) return [];

  const calendarId = await prisma.bookingSetting.findUnique({
    where: { key: "google_calendar_id" },
  });

  const calendar = google.calendar({ version: "v3", auth: client });
  const tz = process.env.TIMEZONE || "America/Toronto";

  const res = await calendar.events.list({
    calendarId: calendarId?.value || "primary",
    timeMin: `${dateStr}T00:00:00`,
    timeMax: `${dateStr}T23:59:59`,
    timeZone: tz,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items || [])
    .filter((e) => e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      start: e.start!.dateTime!.slice(11, 16),
      end: e.end!.dateTime!.slice(11, 16),
    }));
}

export async function listCalendars(): Promise<
  { id: string; summary: string }[]
> {
  const client = await getAuthenticatedClient();
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.calendarList.list();

  return (res.data.items || []).map((c) => ({
    id: c.id || "",
    summary: c.summary || "",
  }));
}

export async function isConnected(): Promise<boolean> {
  const token = await prisma.bookingSetting.findUnique({
    where: { key: "google_access_token" },
  });
  return !!token?.value;
}
