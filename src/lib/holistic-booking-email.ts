/**
 * Emails de confirmation pour les RDV holistiques (clients + praticien·ne·s).
 * Déclenchés par le webhook Stripe quand un paiement passe à PAID.
 *
 * - sendBookingConfirmationToClient : récap du RDV + lien Daily.co si virtuel
 * - sendBookingNotificationToPractitioner : alerte de nouveau RDV avec infos client
 */

import { Resend } from 'resend';
import { BOUTIQUE_LOCATION, INTERAC_EMAIL, INTERAC_MESSAGE, INTERAC_ANSWER } from '@/lib/constants';
import { prisma } from '@/lib/db';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';

function formatMontrealDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface BookingEmailData {
  appointmentId: string;
  clientFirstName: string;
  clientEmail: string;
  practitionerFirstName: string;
  practitionerLastName: string;
  practitionerEmail: string;
  serviceName: string;
  startsAt: Date;
  endsAt: Date;
  mode: 'IN_PERSON' | 'VIRTUAL';
  notes: string | null;
  depositAmount: number;
  remainingAmount: number;
  totalAmount: number;
  dailyRoomUrl?: string | null;
}

/**
 * Email envoyé au CLIENT après confirmation du paiement.
 * Inclut tous les détails du RDV + lien Daily.co (virtuel) ou adresse boutique (présentiel).
 */
export async function sendBookingConfirmationToClient(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const modeLabel = data.mode === 'VIRTUAL' ? 'En ligne (vidéoconférence)' : 'En présentiel';
  const consultationUrl = `${APP_URL}/soins/consultation/${data.appointmentId}`;
  const dashboardUrl = `${APP_URL}/soins/dashboard/client`;

  const locationBlock =
    data.mode === 'VIRTUAL'
      ? `
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Mode :</strong> ${modeLabel}</p>
        <p style="margin: 4px 0; color: #E8DCC8;">
          Tu accéderas à la salle vidéo depuis ton tableau de bord 15 minutes avant le RDV, ou directement via ce lien :<br>
          <a href="${consultationUrl}" style="color: #2EC4B6; word-break: break-all;">${consultationUrl}</a>
        </p>`
      : `
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Mode :</strong> ${modeLabel}</p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Adresse :</strong> ${BOUTIQUE_LOCATION}</p>`;

  const remainderBlock =
    data.remainingAmount > 0
      ? `
        <div style="background: rgba(201, 168, 76, 0.1); border: 1px solid rgba(201, 168, 76, 0.3); border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; color: #C9A84C; font-size: 14px;"><strong>💳 Paiement</strong></p>
          <p style="margin: 0; color: #E8DCC8; font-size: 14px; line-height: 1.6;">
            Acompte reçu : <strong>${data.depositAmount.toFixed(2)} $</strong><br>
            Solde à la fin de la séance : <strong>${data.remainingAmount.toFixed(2)} $</strong> (sera prélevé automatiquement sur la même carte)<br>
            Total : <strong>${data.totalAmount.toFixed(2)} $</strong>
          </p>
        </div>`
      : `
        <div style="background: rgba(46, 196, 182, 0.1); border: 1px solid rgba(46, 196, 182, 0.3); border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; color: #2EC4B6; font-size: 14px;"><strong>✓ Paiement reçu</strong></p>
          <p style="margin: 0; color: #E8DCC8; font-size: 14px;">
            Montant payé : <strong>${data.totalAmount.toFixed(2)} $</strong>
          </p>
        </div>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Confirmation de votre RDV</title></head>
<body style="margin: 0; padding: 0; background: #0A0A12; color: #F5F0E8; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #C9A84C; font-size: 28px; margin: 0; letter-spacing: 0.05em;">Runes &amp; Magie</h1>
      <p style="color: rgba(201, 168, 76, 0.6); font-size: 13px; margin: 8px 0 0; letter-spacing: 0.1em; text-transform: uppercase;">Soins holistiques</p>
    </div>

    <div style="background: #1A1A2E; border: 1px solid rgba(74, 45, 122, 0.4); border-radius: 8px; padding: 32px;">
      <h2 style="color: #C9A84C; font-size: 22px; margin: 0 0 16px;">Ton RDV est confirmé ✨</h2>
      <p style="color: #F5F0E8; font-size: 16px; line-height: 1.6;">
        Bonjour ${data.clientFirstName}, ton paiement a bien été reçu et ta séance est réservée. Voici un récapitulatif :
      </p>

      <div style="background: rgba(107, 63, 160, 0.15); border: 1px solid rgba(107, 63, 160, 0.3); border-radius: 6px; padding: 20px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Date et heure :</strong> ${dateLabel}</p>
        ${locationBlock}
      </div>

      ${remainderBlock}

      <div style="text-align: center; margin: 24px 0 8px;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #4A2D7A, #2D1B4E); color: #C9A84C; text-decoration: none; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em;">
          Voir mes RDV
        </a>
      </div>

      <p style="color: rgba(245, 240, 232, 0.5); font-size: 13px; line-height: 1.6; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid rgba(74, 45, 122, 0.3);">
        <strong>Politique d'annulation :</strong> l'acompte de ${data.depositAmount.toFixed(2)} $ est non remboursable mais réutilisable pour une autre séance jusqu'à 1 an. En cas de question, contacte-nous à <a href="mailto:info@runesetmagie.ca" style="color: #2EC4B6;">info@runesetmagie.ca</a>.
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px; color: rgba(245, 240, 232, 0.4); font-size: 12px;">
      <p>Runes &amp; Magie · Annabelle Dionne · ${APP_URL.replace(/^https?:\/\//, '')}</p>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    console.log('[Email holistique] Confirmation client (Resend non configuré) :', data.clientEmail);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: data.clientEmail,
      subject: `Confirmation de ton RDV — ${data.serviceName}`,
      html,
    });
  } catch (err) {
    console.error('[Email holistique] Échec envoi confirmation client', err);
  }
}

/**
 * Email envoyé à la PRATICIEN·NE pour la prévenir d'un nouveau RDV.
 */
export async function sendBookingNotificationToPractitioner(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const modeLabel = data.mode === 'VIRTUAL' ? 'En ligne (vidéoconférence)' : 'En présentiel';
  const dashboardUrl = `${APP_URL}/soins/dashboard/praticien`;
  const consultationUrl = `${APP_URL}/soins/consultation/${data.appointmentId}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Nouveau RDV</title></head>
<body style="margin: 0; padding: 0; background: #0A0A12; color: #F5F0E8; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #C9A84C; font-size: 28px; margin: 0;">Runes &amp; Magie</h1>
    </div>

    <div style="background: #1A1A2E; border: 1px solid rgba(74, 45, 122, 0.4); border-radius: 8px; padding: 32px;">
      <h2 style="color: #2EC4B6; font-size: 22px; margin: 0 0 16px;">📅 Nouveau rendez-vous</h2>
      <p style="color: #F5F0E8; font-size: 16px; line-height: 1.6;">
        Bonjour ${data.practitionerFirstName}, un·e client·e vient de réserver une séance avec toi.
      </p>

      <div style="background: rgba(107, 63, 160, 0.15); border: 1px solid rgba(107, 63, 160, 0.3); border-radius: 6px; padding: 20px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Client·e :</strong> ${data.clientFirstName}</p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Email :</strong> <a href="mailto:${data.clientEmail}" style="color: #2EC4B6;">${data.clientEmail}</a></p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Date et heure :</strong> ${dateLabel}</p>
        <p style="margin: 4px 0; color: #E8DCC8;"><strong>Mode :</strong> ${modeLabel}</p>
        ${data.mode === 'VIRTUAL' ? `<p style="margin: 8px 0 4px; color: #E8DCC8;"><strong>Lien vidéo :</strong><br><a href="${consultationUrl}" style="color: #2EC4B6; word-break: break-all;">${consultationUrl}</a></p>` : ''}
        ${data.notes ? `<p style="margin: 12px 0 4px; color: #E8DCC8;"><strong>Notes du client :</strong><br><em>${data.notes}</em></p>` : ''}
      </div>

      <div style="background: rgba(46, 196, 182, 0.1); border: 1px solid rgba(46, 196, 182, 0.3); border-radius: 6px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #E8DCC8; font-size: 14px; line-height: 1.5;">
          💰 <strong>${data.depositAmount.toFixed(2)} $</strong> d'acompte reçu (${data.totalAmount.toFixed(2)} $ au total, dont ${data.remainingAmount.toFixed(2)} $ à facturer à la fin de la séance).
        </p>
      </div>

      <div style="text-align: center; margin: 24px 0 8px;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #4A2D7A, #2D1B4E); color: #C9A84C; text-decoration: none; border-radius: 4px; font-size: 14px;">
          Voir mon tableau de bord
        </a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 32px; color: rgba(245, 240, 232, 0.4); font-size: 12px;">
      <p>Runes &amp; Magie — Notification automatique</p>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    console.log('[Email holistique] Notification praticienne (Resend non configuré) :', data.practitionerEmail);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: data.practitionerEmail,
      subject: `Nouveau RDV — ${data.clientFirstName} le ${formatMontrealDateTime(data.startsAt)}`,
      html,
    });
  } catch (err) {
    console.error('[Email holistique] Échec envoi notification praticienne', err);
  }
}

/** Enveloppe HTML commune (en-tête + pied) des courriels holistiques. */
function emailShell(innerHtml: string, footer = 'Runes &amp; Magie · Annabelle Dionne'): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:0.05em;">Runes &amp; Magie</h1>
      <p style="color:rgba(201,168,76,0.6);font-size:13px;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">Soins holistiques</p>
    </div>
    <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
      ${innerHtml}
    </div>
    <div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:12px;"><p>${footer}</p></div>
  </div>
</body></html>`;
}

/** Bloc HTML « mode + lieu/lien » selon présentiel ou virtuel. */
function locationHtml(data: BookingEmailData): string {
  const consultationUrl = `${APP_URL}/soins/consultation/${data.appointmentId}`;
  return data.mode === 'VIRTUAL'
    ? `<p style="margin:4px 0;color:#E8DCC8;"><strong>Mode :</strong> En ligne (vidéoconférence)</p>
       <p style="margin:4px 0;color:#E8DCC8;"><strong>Lien :</strong> <a href="${consultationUrl}" style="color:#2EC4B6;word-break:break-all;">${consultationUrl}</a></p>`
    : `<p style="margin:4px 0;color:#E8DCC8;"><strong>Mode :</strong> En présentiel</p>
       <p style="margin:4px 0;color:#E8DCC8;"><strong>Adresse :</strong> ${BOUTIQUE_LOCATION}</p>`;
}

/**
 * Construit le BookingEmailData à partir d'un appointmentId (charge RDV + client +
 * praticienne, parse le service/mode depuis les notes). null si RDV introuvable.
 * Source unique réutilisée par les courriels de déplacement / annulation / rappel.
 */
export async function buildBookingEmailData(appointmentId: string): Promise<BookingEmailData | null> {
  const appt = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { firstName: true, email: true } },
      practitioner: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  });
  if (!appt) return null;

  const isVirtual = (appt.notes ?? '').toLowerCase().includes('virtuel');
  const serviceMatch = (appt.notes ?? '').match(/Service\s*:\s*([^\n]+)/);
  const serviceName = serviceMatch ? serviceMatch[1].trim() : 'Consultation';
  const cleanNotes = (appt.notes ?? '')
    .replace(/Service\s*:[^\n]*\n?/g, '')
    .replace(/Mode\s*:[^\n]*\n?/g, '')
    .trim();

  return {
    appointmentId: appt.id,
    clientFirstName: appt.client.firstName,
    clientEmail: appt.client.email,
    practitionerFirstName: appt.practitioner.user.firstName,
    practitionerLastName: appt.practitioner.user.lastName,
    practitionerEmail: appt.practitioner.user.email,
    serviceName,
    startsAt: appt.startsAt,
    endsAt: appt.endsAt,
    mode: (isVirtual ? 'VIRTUAL' : 'IN_PERSON') as 'VIRTUAL' | 'IN_PERSON',
    notes: cleanNotes || null,
    depositAmount: appt.depositAmount ?? 0,
    remainingAmount: appt.remainingAmount ?? 0,
    totalAmount: appt.totalAmount ?? 0,
    dailyRoomUrl: appt.dailyRoomUrl ?? null,
  };
}

/** Courriel au CLIENT : son RDV a été déplacé. */
export async function sendRescheduleToClient(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const dashboardUrl = `${APP_URL}/soins/dashboard/client`;
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous a été déplacé 🔄</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance a été reprogrammée. Voici la nouvelle date :
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Nouvelle date et heure :</strong> ${dateLabel}</p>
      ${locationHtml(data)}
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Voir mes RDV</a>
    </div>
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(74,45,122,0.3);">
      Une question ? Écris-nous à <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Déplacement client (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Ton RDV a été déplacé — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi déplacement client', err);
  }
}

/** Courriel au CLIENT : son RDV a été annulé. */
export async function sendCancellationToClient(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Rendez-vous annulé</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ton rendez-vous a été annulé.
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date initialement prévue :</strong> ${dateLabel}</p>
    </div>
    <p style="color:rgba(245,240,232,0.6);font-size:14px;line-height:1.6;margin:16px 0 0;">
      Pour toute question, notamment au sujet d'un éventuel remboursement, contacte-nous à
      <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Annulation client (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Annulation de ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi annulation client', err);
  }
}

/** Courriel à la PRATICIENNE : un RDV a été annulé. */
export async function sendCancellationToPractitioner(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const dashboardUrl = `${APP_URL}/soins/dashboard/praticien`;
  const html = emailShell(`
    <h2 style="color:#2EC4B6;font-size:22px;margin:0 0 16px;">Rendez-vous annulé</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.practitionerFirstName}, un rendez-vous de ton agenda a été annulé.
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Client·e :</strong> ${data.clientFirstName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date initialement prévue :</strong> ${dateLabel}</p>
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;">Voir mon tableau de bord</a>
    </div>
  `, 'Runes &amp; Magie — Notification automatique');
  if (!resend) {
    console.log('[Email holistique] Annulation praticienne (Resend non configuré) :', data.practitionerEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.practitionerEmail, subject: `RDV annulé — ${data.clientFirstName} le ${dateLabel}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi annulation praticienne', err);
  }
}

/** Courriel de rappel au CLIENT (3 jours ou 24h avant). */
export async function sendReminderToClient(data: BookingEmailData, lead: '3d' | '24h'): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const dashboardUrl = `${APP_URL}/soins/dashboard/client`;
  const when = lead === '3d' ? 'dans 3 jours' : 'demain';
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Rappel : ta séance ${when} ✨</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, un petit rappel pour ton rendez-vous à venir :
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date et heure :</strong> ${dateLabel}</p>
      ${locationHtml(data)}
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Voir mes RDV</a>
    </div>
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(74,45,122,0.3);">
      Besoin de déplacer ou d'annuler ? Contacte-nous à <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Rappel client (Resend non configuré) :', data.clientEmail, lead);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Rappel : ta séance ${when} — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi rappel client', err);
  }
}

/** Libellé lisible d'un mode de paiement manuel. */
function paymentModeLabel(mode: string): string {
  if (mode === 'CASH') return 'Comptant';
  if (mode === 'STRIPE_LINK') return 'Lien de paiement (carte)';
  if (mode === 'INTERAC') return 'Virement Interac';
  return mode;
}

/** Bloc HTML « récap du RDV » (service, praticienne, date, lieu/lien). */
function bookingRecapHtml(data: BookingEmailData): string {
  return `
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date et heure :</strong> ${formatMontrealDateTime(data.startsAt)}</p>
      ${locationHtml(data)}
    </div>`;
}

/** Courriel d'ACTIVATION (nouveau compte) : bienvenue + lien « définir mon mot de passe » + récap RDV. */
export async function sendSetPasswordEmail(data: BookingEmailData, token: string): Promise<void> {
  const setUrl = `${APP_URL}/soins/auth/definir-mot-de-passe?token=${encodeURIComponent(token)}`;
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Bienvenue chez Runes &amp; Magie ✨</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, un compte a été créé pour toi afin de suivre ton rendez-vous.
      Choisis ton mot de passe pour l'activer :
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${setUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Définir mon mot de passe</a>
    </div>
    ${bookingRecapHtml(data)}
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(74,45,122,0.3);">
      Ce lien est valide 7 jours. Une question ? Écris-nous à <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Activation compte (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: 'Crée ton mot de passe — Runes & Magie', html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi activation compte', err);
  }
}

/** Courriel de confirmation d'un RDV manuel réglé COMPTANT (compte déjà existant). */
export async function sendManualCashConfirmationToClient(data: BookingEmailData): Promise<void> {
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous est confirmé ✨</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance est réservée. Voici un récapitulatif :
    </p>
    ${bookingRecapHtml(data)}
    <div style="background:rgba(46,196,182,0.1);border:1px solid rgba(46,196,182,0.3);border-radius:6px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#E8DCC8;font-size:14px;"><strong>Paiement :</strong> réglé comptant — ${data.totalAmount.toFixed(2)} $</p>
    </div>
  `);
  if (!resend) {
    console.log('[Email holistique] Confirmation comptant (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Confirmation de ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi confirmation comptant', err);
  }
}

/** Courriel avec le LIEN DE PAIEMENT Stripe (RDV réservé, à régler en ligne). */
export async function sendPaymentLinkToClient(data: BookingEmailData, paymentUrl: string): Promise<void> {
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous est réservé 💳</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance est réservée. Il reste à régler le paiement :
    </p>
    ${bookingRecapHtml(data)}
    <div style="text-align:center;margin:24px 0;">
      <a href="${paymentUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Payer ${data.totalAmount.toFixed(2)} $</a>
    </div>
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:16px 0 0;">
      Ce lien de paiement est valide 24 h. Tu recevras une confirmation dès le paiement reçu.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Lien de paiement (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Paiement de ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi lien de paiement', err);
  }
}

/** Courriel avec les INSTRUCTIONS DE VIREMENT Interac. */
export async function sendInteracInstructionsToClient(data: BookingEmailData): Promise<void> {
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous est réservé 🏦</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance est réservée. Merci de régler par virement Interac :
    </p>
    ${bookingRecapHtml(data)}
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#C9A84C;font-size:14px;"><strong>💳 Virement Interac</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Destinataire :</strong> ${INTERAC_EMAIL}</p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Montant :</strong> ${data.totalAmount.toFixed(2)} $</p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Description :</strong> ${INTERAC_MESSAGE}</p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Réponse secrète :</strong> ${INTERAC_ANSWER}</p>
    </div>
  `);
  if (!resend) {
    console.log('[Email holistique] Infos Interac (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Virement pour ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi infos Interac', err);
  }
}

/** Courriel à la PRATICIENNE : un RDV a été ajouté manuellement (par l'admin). */
export async function sendManualNotificationToPractitioner(
  data: BookingEmailData,
  clientPhone: string,
  paymentMode: string,
): Promise<void> {
  const dashboardUrl = `${APP_URL}/soins/dashboard/praticien`;
  const html = emailShell(`
    <h2 style="color:#2EC4B6;font-size:22px;margin:0 0 16px;">📅 Nouveau rendez-vous ajouté</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.practitionerFirstName}, un rendez-vous a été ajouté à ton agenda.
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Client·e :</strong> ${data.clientFirstName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Téléphone :</strong> ${clientPhone}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date et heure :</strong> ${formatMontrealDateTime(data.startsAt)}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Paiement :</strong> ${paymentModeLabel(paymentMode)}</p>
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;">Voir mon tableau de bord</a>
    </div>
  `, 'Runes &amp; Magie — Notification automatique');
  if (!resend) {
    console.log('[Email holistique] Notif praticienne RDV manuel (Resend non configuré) :', data.practitionerEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.practitionerEmail, subject: `Nouveau RDV — ${data.clientFirstName} le ${formatMontrealDateTime(data.startsAt)}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi notif praticienne RDV manuel', err);
  }
}
