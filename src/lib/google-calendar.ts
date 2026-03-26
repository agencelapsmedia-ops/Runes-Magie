import { google } from "googleapis";
import { prisma } from "@/lib/db";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"];

function getOAuth2Client() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

async function getAuthenticatedClient() {
  const client = getOAuth2Client();
  const accessToken = await prisma.bookingSetting.findUnique({ where: { key: "google_access_token" } });
  const refreshToken = await prisma.bookingSetting.findUnique({ where: { key: "google_refresh_token" } });
  if (!accessToken || !refreshToken) return null;
  client.setCredentials({ access_token: accessToken.value, refresh_token: refreshToken.value });
  return client;
}

export function getAuthUrl(): string {
  return getOAuth2Client().generateAuthUrl({ access_type: "offline", scope: SCOPES, prompt: "consent" });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (tokens.access_token) await prisma.bookingSetting.upsert({ where: { key: "google_access_token" }, update: { value: tokens.access_token }, create: { key: "google_access_token", value: tokens.access_token } });
  if (tokens.refresh_token) await prisma.bookingSetting.upsert({ where: { key: "google_refresh_token" }, update: { value: tokens.refresh_token }, create: { key: "google_refresh_token", value: tokens.refresh_token } });
}

export async function createEvent(appointment: { clientName: string; clientEmail: string; date: Date; startTime: string; endTime: string; service: { name: string; emoji: string; durationMinutes: number } }): Promise<string | null> {
  const client = await getAuthenticatedClient();
  if (!client) return null;
  const calendarId = (await prisma.bookingSetting.findUnique({ where: { key: "google_calendar_id" } }))?.value || "primary";
  const calendar = google.calendar({ version: "v3", auth: client });
  const dateStr = appointment.date.toISOString().split("T")[0];
  const tz = process.env.TIMEZONE || "America/Toronto";
  const event = await calendar.events.insert({ calendarId, requestBody: { summary: `${appointment.service.emoji} ${appointment.service.name} - ${appointment.clientName}`, start: { dateTime: `${dateStr}T${appointment.startTime}:00`, timeZone: tz }, end: { dateTime: `${dateStr}T${appointment.endTime}:00`, timeZone: tz } } });
  return event.data.id || null;
}

export async function deleteEvent(googleEventId: string) {
  const client = await getAuthenticatedClient();
  if (!client) return;
  const calendarId = (await prisma.bookingSetting.findUnique({ where: { key: "google_calendar_id" } }))?.value || "primary";
  await google.calendar({ version: "v3", auth: client }).events.delete({ calendarId, eventId: googleEventId });
}

export async function isConnected(): Promise<boolean> {
  const token = await prisma.bookingSetting.findUnique({ where: { key: "google_access_token" } });
  return !!token?.value;
}
