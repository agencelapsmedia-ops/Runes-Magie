import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.FROM_EMAIL || "Runes & Magie <noreply@runesetmagie.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  serviceEmoji: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  price?: number | null;
  confirmationToken: string;
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0A0A12;color:#F5F0E8;font-family:'Georgia',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-family:'Georgia',serif;color:#C9A84C;font-size:28px;margin:0;">Runes & Magie</h1>
      <p style="color:#E8DCC8;font-style:italic;margin:8px 0 0;">Votre Sorciere</p>
    </div>
    <div style="background-color:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;">
      <p style="margin:0;">Runes & Magie - Boutique-Ecole de Sorcellerie</p>
      <p style="margin:4px 0 0;">Annabelle Dionne - Noctura Anna</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendConfirmationEmail(data: BookingEmailData) {
  const cancelUrl = `${APP_URL}/reserver/confirmation/${data.confirmationToken}`;

  const html = baseTemplate(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Votre seance est reservee ${data.serviceEmoji}</h2>
    <p style="color:#F5F0E8;font-size:16px;margin:0 0 24px;">
      Bonjour ${data.clientName},<br/>
      Votre reservation a bien ete enregistree.
    </p>
    <div style="background-color:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Date :</strong> ${data.date}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Heure :</strong> ${data.startTime}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Duree :</strong> ${data.durationMinutes} minutes</p>
      ${data.price ? `<p style="margin:0;color:#E8DCC8;"><strong>Prix :</strong> ${data.price.toFixed(2).replace(".", ",")} $</p>` : ""}
    </div>
    <p style="color:rgba(245,240,232,0.7);font-size:14px;margin:0 0 16px;">
      Politique d'annulation : vous pouvez annuler jusqu'a 24 heures avant votre seance.
    </p>
    <div style="text-align:center;">
      <a href="${cancelUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;border:1px solid rgba(201,168,76,0.3);font-size:14px;">
        Voir ou annuler ma reservation
      </a>
    </div>
  `);

  if (!resend) {
    console.log("[Email] Confirmation email would be sent to:", data.clientEmail);
    console.log("[Email] HTML length:", html.length);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `Confirmation - ${data.serviceName} | Runes & Magie`,
    html,
  });
}

export async function sendReminderEmail(data: BookingEmailData) {
  const cancelUrl = `${APP_URL}/reserver/confirmation/${data.confirmationToken}`;

  const html = baseTemplate(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Rappel : votre seance est demain ${data.serviceEmoji}</h2>
    <p style="color:#F5F0E8;font-size:16px;margin:0 0 24px;">
      Bonjour ${data.clientName},<br/>
      Votre seance <strong>${data.serviceName}</strong> est prevue demain a <strong>${data.startTime}</strong>.
    </p>
    <div style="background-color:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Date :</strong> ${data.date}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Heure :</strong> ${data.startTime}</p>
      <p style="margin:0;color:#E8DCC8;"><strong>Duree :</strong> ${data.durationMinutes} minutes</p>
    </div>
    <div style="text-align:center;">
      <a href="${cancelUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;border:1px solid rgba(201,168,76,0.3);font-size:14px;">
        Voir ma reservation
      </a>
    </div>
  `);

  if (!resend) {
    console.log("[Email] Reminder email would be sent to:", data.clientEmail);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `Rappel - ${data.serviceName} demain | Runes & Magie`,
    html,
  });
}

export async function sendAdminNotification(data: BookingEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = baseTemplate(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Nouveau rendez-vous ${data.serviceEmoji}</h2>
    <div style="background-color:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Client :</strong> ${data.clientName}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Email :</strong> ${data.clientEmail}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:0 0 8px;color:#E8DCC8;"><strong>Date :</strong> ${data.date}</p>
      <p style="margin:0;color:#E8DCC8;"><strong>Heure :</strong> ${data.startTime}</p>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/admin/rendez-vous" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;border:1px solid rgba(201,168,76,0.3);font-size:14px;">
        Voir dans l'admin
      </a>
    </div>
  `);

  if (!resend) {
    console.log("[Email] Admin notification would be sent to:", adminEmail);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Nouveau RDV - ${data.clientName} - ${data.serviceName}`,
    html,
  });
}
