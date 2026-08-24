/**
 * Notification courriel des conversations du chat Noctura.
 * À chaque message d'une visiteuse, Noctura (praticienne propriétaire) reçoit
 * un courriel avec le message et un lien vers la conversation dans l'admin.
 * Le « Répondre à » du courriel est l'adresse de la visiteuse : Noctura peut
 * lui répondre directement depuis sa boîte courriel.
 *
 * Anti-rafale : si la visiteuse a écrit il y a moins de 15 minutes, on n'envoie
 * pas un deuxième courriel — le premier suffit pour ouvrir la conversation.
 */
import { Resend } from 'resend';
import { prisma } from '@/lib/db';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';
const RAFALE_MINUTES = 15;

export async function notifyNocturaOfChatMessage(params: {
  conversationId: string;
  message: string;
  visitorName: string | null;
  visitorEmail: string | null;
}): Promise<void> {
  if (!resend) return;
  try {
    // Un seul courriel par rafale : y a-t-il un message de la visiteuse dans
    // les 15 dernières minutes AVANT celui-ci ?
    const recent = await prisma.chatMessage.findFirst({
      where: {
        conversationId: params.conversationId,
        role: 'user',
        createdAt: { gte: new Date(Date.now() - RAFALE_MINUTES * 60_000) },
      },
      orderBy: { createdAt: 'desc' },
      skip: 1, // saute le message qui vient d'être créé
    });
    if (recent) return;

    // Adresse de Noctura = praticienne propriétaire.
    const owner = await prisma.practitioner.findFirst({
      where: { isOwner: true },
      select: { user: { select: { email: true, firstName: true } } },
    });
    const to = owner?.user.email;
    if (!to) return;

    const nom = params.visitorName || 'Une visiteuse';
    const lien = `${APP_URL}/admin/conversations?id=${params.conversationId}`;
    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2D1B4E;">
        <h2 style="color: #6B3FA0;">💬 Nouveau message dans le chat</h2>
        <p><strong>${nom}</strong>${params.visitorEmail ? ` (${params.visitorEmail})` : ''} vient d'écrire :</p>
        <blockquote style="border-left: 3px solid #C9A84C; margin: 16px 0; padding: 10px 16px; background: #FAF7F0; white-space: pre-line;">${params.message
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</blockquote>
        <p>
          <a href="${lien}" style="display: inline-block; background: #6B3FA0; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Voir la conversation et répondre dans le chat</a>
        </p>
        ${params.visitorEmail
          ? `<p style="font-size: 0.9rem; color: #6B7280;">Tu peux aussi <strong>répondre directement à ce courriel</strong> : ta réponse partira à ${params.visitorEmail}.</p>`
          : `<p style="font-size: 0.9rem; color: #6B7280;">Cette visiteuse n'a pas de courriel au dossier — réponds via le chat avec le bouton ci-dessus.</p>`}
      </div>`;

    await resend.emails.send({
      from: FROM,
      to,
      ...(params.visitorEmail ? { replyTo: params.visitorEmail } : {}),
      subject: `💬 Chat — nouveau message de ${nom}`,
      html,
    });
  } catch (err) {
    console.error('[chat] notification courriel échouée (non-bloquant)', err);
  }
}
