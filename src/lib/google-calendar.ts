/**
 * google-calendar.ts — Intégration Google Agenda (sync des RDV holistiques).
 *
 * Chaque praticienne connecte SON propre Google Agenda via OAuth (flux dédié,
 * séparé du login). On stocke un refresh token sur sa fiche Practitioner.
 *
 * Phase 1 — sens sortant : quand un RDV passe en CONFIRMED (webhook Stripe),
 * on crée l'événement dans l'agenda de la praticienne et on garde le googleEventId.
 *
 * Calqué sur daily-co.ts : best-effort, ne lève jamais d'exception (retourne null
 * en cas d'échec), variables d'env lues au niveau fonction.
 */

import { google } from 'googleapis';
import { prisma } from '@/lib/db';
import { BOUTIQUE_LOCATION } from '@/lib/constants';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TIMEZONE = 'America/Toronto';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

/** True si les variables d'env Google sont configurées. */
export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

/** URL de consentement Google vers laquelle rediriger la praticienne. */
export function getGoogleAuthUrl(state: string): string {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: 'offline', // nécessaire pour obtenir un refresh_token
    prompt: 'consent', // force le renvoi du refresh_token même si déjà autorisé
    scope: SCOPES,
    state,
  });
}

/**
 * Échange le code OAuth contre des tokens. Retourne le refresh_token + l'email
 * du compte Google connecté (= id de l'agenda « primary »). null si échec.
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<{ refreshToken: string; email: string | null } | null> {
  try {
    const oauth2 = getOAuthClient();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      console.error('[Google Calendar] aucun refresh_token reçu (compte déjà autorisé ?)');
      return null;
    }
    oauth2.setCredentials(tokens);

    // L'id de l'agenda « primary » est l'adresse courriel du compte Google.
    let email: string | null = null;
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2 });
      const primary = await calendar.calendars.get({ calendarId: 'primary' });
      email = primary.data.id ?? null;
    } catch (err) {
      console.warn('[Google Calendar] impossible de lire l\'email du compte', err);
    }

    return { refreshToken: tokens.refresh_token, email };
  } catch (err) {
    console.error('[Google Calendar] échec de l\'échange du code', err);
    return null;
  }
}

/**
 * Client Calendar v3 authentifié pour une praticienne (refresh auto de l'access
 * token via le refresh token stocké). null si non connectée / non configuré.
 */
async function getCalendarForPractitioner(practitionerId: string) {
  if (!isGoogleCalendarConfigured()) return null;
  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    select: { googleRefreshToken: true },
  });
  if (!practitioner?.googleRefreshToken) return null;

  const oauth2 = getOAuthClient();
  oauth2.setCredentials({ refresh_token: practitioner.googleRefreshToken });
  return google.calendar({ version: 'v3', auth: oauth2 });
}

/**
 * Crée l'événement Google pour un RDV confirmé et stocke le googleEventId.
 * Best-effort : retourne l'id de l'événement ou null. Ne lève jamais.
 * Idempotent (ne recrée pas si googleEventId déjà présent).
 *
 * À appeler depuis le webhook Stripe après passage du RDV en CONFIRMED.
 */
export async function createCalendarEventForAppointment(
  appointmentId: string,
): Promise<string | null> {
  try {
    const appt = await prisma.holisticAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!appt) return null;
    if (appt.googleEventId) return appt.googleEventId; // idempotent

    const calendar = await getCalendarForPractitioner(appt.practitionerId);
    if (!calendar) return null; // praticienne non connectée → on ignore silencieusement

    const serviceMatch = (appt.notes ?? '').match(/Service\s*:\s*([^\n]+)/);
    const serviceName = serviceMatch ? serviceMatch[1].trim() : 'Soin';
    const clientName = `${appt.client.firstName} ${appt.client.lastName}`.trim();

    // Présentiel → adresse boutique ; virtuel → lien vers la salle de consultation
    // (page de l'app qui ouvre/embarque la salle Daily.co — lien stable et canonique).
    const isVirtual = (appt.notes ?? '').toLowerCase().includes('virtuel');
    const consultationUrl = `${APP_URL}/soins/consultation/${appt.id}`;
    const location = isVirtual ? consultationUrl : BOUTIQUE_LOCATION;
    const locationLine = isVirtual
      ? `Vidéoconférence : ${consultationUrl}`
      : `Adresse : ${BOUTIQUE_LOCATION}`;

    const description = [
      `Client : ${clientName}`,
      appt.client.email ? `Courriel : ${appt.client.email}` : null,
      appt.client.phone ? `Téléphone : ${appt.client.phone}` : null,
      appt.totalAmount != null ? `Prix : ${appt.totalAmount} $` : null,
      `\n${locationLine}`,
      appt.notes ? `\nNotes :\n${appt.notes}` : null,
      `\n— Réservation Runes & Magie`,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${serviceName} — ${clientName}`,
        description,
        location,
        start: { dateTime: appt.startsAt.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: appt.endsAt.toISOString(), timeZone: TIMEZONE },
      },
    });

    const eventId = res.data.id ?? null;
    if (eventId) {
      await prisma.holisticAppointment.update({
        where: { id: appointmentId },
        data: { googleEventId: eventId },
      });
    }
    return eventId;
  } catch (err) {
    console.error('[Google Calendar] échec création événement', { appointmentId, err });
    return null;
  }
}

/**
 * Met à jour l'événement Google d'un RDV (ex : déplacement). Patch début/fin + lieu.
 * Best-effort : retourne true si patché, false sinon (pas d'événement, non connectée…).
 * Ne lève jamais.
 */
export async function updateCalendarEventForAppointment(
  appointmentId: string,
): Promise<boolean> {
  try {
    const appt = await prisma.holisticAppointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        practitionerId: true,
        googleEventId: true,
        startsAt: true,
        endsAt: true,
        notes: true,
      },
    });
    if (!appt?.googleEventId) return false;

    const calendar = await getCalendarForPractitioner(appt.practitionerId);
    if (!calendar) return false;

    const isVirtual = (appt.notes ?? '').toLowerCase().includes('virtuel');
    const consultationUrl = `${APP_URL}/soins/consultation/${appt.id}`;
    const location = isVirtual ? consultationUrl : BOUTIQUE_LOCATION;

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: appt.googleEventId,
      requestBody: {
        location,
        start: { dateTime: appt.startsAt.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: appt.endsAt.toISOString(), timeZone: TIMEZONE },
      },
    });
    return true;
  } catch (err) {
    console.error('[Google Calendar] échec mise à jour événement', { appointmentId, err });
    return false;
  }
}

/**
 * Supprime l'événement Google d'un RDV (ex : annulation). Best-effort.
 */
export async function deleteCalendarEventForAppointment(
  appointmentId: string,
): Promise<boolean> {
  try {
    const appt = await prisma.holisticAppointment.findUnique({
      where: { id: appointmentId },
      select: { practitionerId: true, googleEventId: true },
    });
    if (!appt?.googleEventId) return false;

    const calendar = await getCalendarForPractitioner(appt.practitionerId);
    if (!calendar) return false;

    await calendar.events.delete({ calendarId: 'primary', eventId: appt.googleEventId });
    await prisma.holisticAppointment.update({
      where: { id: appointmentId },
      data: { googleEventId: null },
    });
    return true;
  } catch (err) {
    console.error('[Google Calendar] échec suppression événement', { appointmentId, err });
    return false;
  }
}

/**
 * Rattrapage : pousse dans Google tous les RDV FUTURS déjà CONFIRMÉS de la
 * praticienne qui n'ont pas encore d'événement (googleEventId null).
 * Sert au rattrapage automatique à la connexion ET au bouton « Resynchroniser ».
 * Best-effort : ne lève jamais. Retourne le nombre synchronisé et le total candidat.
 */
export async function syncFutureConfirmedAppointments(
  practitionerId: string,
): Promise<{ synced: number; total: number }> {
  try {
    const now = new Date();
    const appts = await prisma.holisticAppointment.findMany({
      where: {
        practitionerId,
        status: 'CONFIRMED',
        googleEventId: null,
        startsAt: { gte: now },
      },
      select: { id: true },
    });
    let synced = 0;
    for (const a of appts) {
      const eventId = await createCalendarEventForAppointment(a.id);
      if (eventId) synced++;
    }
    return { synced, total: appts.length };
  } catch (err) {
    console.error('[Google Calendar] échec rattrapage RDV', { practitionerId, err });
    return { synced: 0, total: 0 };
  }
}
