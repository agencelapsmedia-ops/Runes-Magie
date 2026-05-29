import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';

// Destinataires des notifications de modification praticien (cumul)
const ADMIN_NOTIFY_EMAILS = [
  'agencelapsmedia@gmail.com',
  'info@runesetmagie.ca',
];

interface NotifyAdminsPractitionerChangeArgs {
  practitionerName: string;
  changeType: 'PROFILE' | 'AVAILABILITY';
  fieldsChanged: string[]; // ex: ['bio', 'specialties'] ou ['availability blocks']
  changeId: string;
}

/**
 * Envoie un email aux admins quand une praticienne soumet une demande de modification.
 * Fail-safe : si Resend n'est pas configuré ou échoue, on log mais ne bloque pas la création de la demande.
 */
export async function notifyAdminsPractitionerChange(
  args: NotifyAdminsPractitionerChangeArgs,
): Promise<void> {
  const { practitionerName, changeType, fieldsChanged, changeId } = args;
  const approvalUrl = `${APP_URL}/admin/praticiens/modifications`;
  const typeLabel = changeType === 'PROFILE' ? 'profil' : 'disponibilités';
  const fieldsList = fieldsChanged.join(', ') || 'plusieurs champs';

  if (!resend) {
    console.log('[Email] Practitioner change notification (Resend non configuré):', {
      to: ADMIN_NOTIFY_EMAILS,
      practitionerName,
      changeType,
      fieldsChanged,
      changeId,
    });
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Demande de modification — Runes & Magie</title>
    </head>
    <body style="font-family: 'Georgia', serif; background: #f8f6f2; padding: 24px; color: #1F2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
        <h1 style="font-family: 'Cinzel', serif; color: #2D1B4E; font-size: 1.4rem; margin: 0 0 16px;">
          ᚻ Demande de modification — ${typeLabel}
        </h1>
        <p style="font-size: 1rem; line-height: 1.6; color: #374151;">
          <strong>${practitionerName}</strong> souhaite modifier son ${typeLabel}.
        </p>
        <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 12px 16px; margin: 20px 0; font-size: 0.9rem;">
          <strong>Champs concernés :</strong> ${fieldsList}
        </div>
        <p style="font-size: 0.95rem; color: #6B7280;">
          Les informations actuelles restent visibles aux clients tant que tu n&apos;as pas approuvé ou rejeté cette demande.
        </p>
        <div style="margin-top: 28px; text-align: center;">
          <a href="${approvalUrl}" style="display: inline-block; background: #6B3FA0; color: #FFFFFF; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-family: 'Cinzel', serif; font-size: 0.85rem; letter-spacing: 0.05em;">
            Voir et approuver →
          </a>
        </div>
        <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 0.8rem; color: #9CA3AF; text-align: center;">
          ID de la demande : ${changeId}<br>
          Runes &amp; Magie — Notification automatique
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_NOTIFY_EMAILS,
      subject: `Modification ${typeLabel} de ${practitionerName} — à approuver`,
      html,
    });
  } catch (err) {
    console.error('[Email] Échec envoi notification modification praticien :', err);
  }
}
