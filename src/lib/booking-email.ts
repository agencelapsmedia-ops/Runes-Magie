import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || "Runes & Magie <noreply@runesetmagie.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface BookingEmailData {
  clientName: string; clientEmail: string; serviceName: string; serviceEmoji: string;
  date: string; startTime: string; durationMinutes: number; price?: number | null;
  confirmationToken: string;
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><h1 style="color:#C9A84C;font-size:28px;margin:0;">Runes & Magie</h1></div><div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">${content}</div><div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;"><p>Runes & Magie - Annabelle Dionne</p></div></div></body></html>`;
}

export async function sendConfirmationEmail(data: BookingEmailData) {
  const url = `${APP_URL}/reserver/confirmation/${data.confirmationToken}`;
  const html = baseTemplate(`<h2 style="color:#C9A84C;">Votre seance est reservee ${data.serviceEmoji}</h2><p style="color:#F5F0E8;">Bonjour ${data.clientName}, votre reservation a ete enregistree.</p><div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:16px 0;"><p style="margin:4px 0;color:#E8DCC8;"><strong>Service:</strong> ${data.serviceName}</p><p style="margin:4px 0;color:#E8DCC8;"><strong>Date:</strong> ${data.date}</p><p style="margin:4px 0;color:#E8DCC8;"><strong>Heure:</strong> ${data.startTime}</p><p style="margin:4px 0;color:#E8DCC8;"><strong>Duree:</strong> ${data.durationMinutes} min</p></div><div style="text-align:center;"><a href="${url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;">Voir ma reservation</a></div>`);
  if (!resend) { console.log("[Email] Confirmation to:", data.clientEmail); return; }
  await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Confirmation - ${data.serviceName} | Runes & Magie`, html });
}

export async function sendReminderEmail(data: BookingEmailData) {
  const html = baseTemplate(`<h2 style="color:#C9A84C;">Rappel: votre seance est demain ${data.serviceEmoji}</h2><p style="color:#F5F0E8;">Bonjour ${data.clientName}, votre seance ${data.serviceName} est prevue demain a ${data.startTime}.</p>`);
  if (!resend) { console.log("[Email] Reminder to:", data.clientEmail); return; }
  await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Rappel - ${data.serviceName} | Runes & Magie`, html });
}

export async function sendAdminNotification(data: BookingEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const html = baseTemplate(`<h2 style="color:#C9A84C;">Nouveau rendez-vous ${data.serviceEmoji}</h2><div style="background:rgba(107,63,160,0.15);padding:20px;border-radius:6px;"><p style="margin:4px 0;color:#E8DCC8;"><strong>Client:</strong> ${data.clientName}</p><p style="margin:4px 0;color:#E8DCC8;"><strong>Service:</strong> ${data.serviceName}</p><p style="margin:4px 0;color:#E8DCC8;"><strong>Date:</strong> ${data.date} a ${data.startTime}</p></div>`);
  if (!resend) { console.log("[Email] Admin notification to:", adminEmail); return; }
  await resend.emails.send({ from: FROM, to: adminEmail, subject: `Nouveau RDV - ${data.clientName}`, html });
}
