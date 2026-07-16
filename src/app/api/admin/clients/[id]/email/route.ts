import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { isInternalEmail } from '@/lib/holistic-clients';
import { BOUTIQUE_PHONE, SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const REPLY_TO = 'info@runesetmagie.ca';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** POST /api/admin/clients/[id]/email — envoie un courriel personnalisé au client. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  if (!resend) {
    return NextResponse.json(
      { error: "L'envoi de courriels n'est pas configuré (RESEND_API_KEY absente)." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const client = await prisma.holisticUser.findUnique({
    where: { id },
    select: { email: true, firstName: true },
  });
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  if (isInternalEmail(client.email)) {
    return NextResponse.json(
      { error: "Ce client n'a pas de vraie adresse courriel (fiche créée manuellement)." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!subject || !message) {
    return NextResponse.json({ error: 'Le sujet et le message sont requis.' }, { status: 400 });
  }
  if (subject.length > 200 || message.length > 10000) {
    return NextResponse.json({ error: 'Sujet ou message trop long.' }, { status: 400 });
  }

  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');
  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin: 0; padding: 0; background: #0A0A12; color: #F5F0E8; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #C9A84C; font-size: 28px; margin: 0; letter-spacing: 0.05em;">Runes &amp; Magie</h1>
      <p style="color: rgba(201, 168, 76, 0.6); font-size: 13px; margin: 8px 0 0; letter-spacing: 0.1em; text-transform: uppercase;">Boutique-école de sorcellerie</p>
    </div>

    <div style="background: #1A1A2E; border: 1px solid rgba(74, 45, 122, 0.4); border-radius: 8px; padding: 32px;">
      <p style="color: #F5F0E8; font-size: 16px; line-height: 1.7; margin: 0;">${messageHtml}</p>

      <p style="color: rgba(245, 240, 232, 0.5); font-size: 13px; line-height: 1.6; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid rgba(74, 45, 122, 0.3);">
        Tu peux répondre directement à ce courriel — il arrivera à l'équipe.<br>
        Runes &amp; Magie · ${BOUTIQUE_PHONE} · <a href="${SITE_URL}" style="color: #2EC4B6;">${SITE_URL.replace('https://', '')}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: client.email,
    replyTo: REPLY_TO,
    subject,
    html,
  });
  if (error) {
    return NextResponse.json({ error: `Échec de l'envoi : ${error.message}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
