/**
 * ROUTE TEMPORAIRE — envoi d'un exemplaire du courriel d'invitation à UNE adresse,
 * pour validation avant diffusion. À SUPPRIMER après usage.
 *
 * Protégée par CRON_SECRET. Placée sous /api/cron/ pour hériter de la même
 * convention d'authentification que les autres tâches ; elle n'est PAS déclarée
 * dans vercel.json et ne s'exécute donc jamais automatiquement.
 *
 * Usage : POST /api/cron/_envoi-invitation  avec { "to": "adresse@exemple.com" }
 */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';

function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

const HTML = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:2px;">Runes &amp; Magie</h1>
    <p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p>
  </div>
  <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
    <p style="color:#2EC4B6;font-size:12px;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Sabbat de Lughnasadh</p>
    <h2 style="color:#C9A84C;margin:0 0 8px;font-size:24px;line-height:1.3;">Le passage du Feu</h2>
    <p style="color:#E8DCC8;font-style:italic;margin:0 0 24px;">avec Noctura et Odalguir</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:0 0 24px;">
      <p style="margin:4px 0;color:#C9A84C;font-size:17px;"><strong>Samedi 8 août, de 13 h à 14 h 30</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;">Le Temple — Boutique Runes &amp; Magie <em>(sous-sol)</em></p>
      <p style="margin:4px 0;color:#E8DCC8;">149 rue Saint-Eustache, Saint-Eustache</p>
      <p style="margin:12px 0 0;color:#2EC4B6;font-size:15px;letter-spacing:1px;"><strong>C'EST GRATUIT — 15 places seulement</strong></p>
    </div>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Venez célébrer le passage du Feu cet été et apposer votre intention pour manifester votre meilleur futur dans la Toile.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Nous ferons un rituel inspiré du sabbat de Lughnasadh avec les 4 éléments de la Nature et à l'aide de la Magie Naturelle. Nous explorerons l'élément sacré du Feu et ses concepts, et nous invoquerons l'énergie de la <strong style="color:#C9A84C;">Déesse Sekhmet</strong>, divinité égyptienne à tête de lionne, afin de nous instiller de cet archétype de force, de protection et de volonté jusqu'à Samhain.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Nous aborderons votre lien avec cet élément : comment il vous affecte au quotidien, comment il peut nourrir votre <em>Ka</em> — votre énergie vitale, votre feu spirituel — et comment il influence vos relations et votre bien-être.</p>
    <p style="color:#E8DCC8;line-height:1.7;margin:0 0 28px;font-style:italic;">Guidance personnelle et partages ouverts sont également au menu.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.runesetmagie.ca/evenements/rituel-de-lughnasadh" style="display:inline-block;padding:16px 36px;background:linear-gradient(to right,#4A2D7A,#2D1B4E);border:1px solid #C9A84C;border-radius:4px;color:#C9A84C;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Réserver ma place</a>
    </div>
    <p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;margin:0;">Vous préférez le téléphone ? Appelez Noctura au <a href="tel:+15143487705" style="color:#C9A84C;text-decoration:none;">(514) 348-7705</a>.</p>
  </div>
  <div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;">
    <p style="margin:0 0 4px;">Runes &amp; Magie - Annabelle Dionne, Guide Spirituelle</p>
    <p style="margin:0;font-size:11px;">www.runesetmagie.ca</p>
  </div>
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(245,240,232,0.15);text-align:center;color:rgba(245,240,232,0.4);font-size:12px;line-height:1.6;">
    <p style="margin:0 0 8px;">Runes &amp; Magie — Boutique-école de sorcellerie</p>
    <p style="margin:0 0 8px;">Annabelle Dionne, Guide Spirituelle</p>
    <p style="margin:0 0 16px;">info@runesetmagie.com · (514) 348-7705</p>
    <p style="margin:0;font-size:11px;">Vous recevez ce courriel car vous êtes inscrit(e) à notre infolettre.<br /><a href="https://www.runesetmagie.ca/infolettre" style="color:rgba(46,196,182,0.7);text-decoration:underline;">Se désabonner en un clic</a></p>
    <p style="margin:8px 0 0;font-size:10px;color:rgba(245,240,232,0.25);font-style:italic;">Conforme Loi 25 (Québec) et LCAP. Désabonnement immédiat et définitif.</p>
  </div>
</div>
</body></html>`;

export async function POST(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  if (!resend) {
    return NextResponse.json({ error: 'RESEND_API_KEY absente' }, { status: 500 });
  }

  let to = '';
  try {
    const corps = (await req.json()) as { to?: unknown };
    if (typeof corps.to === 'string') to = corps.to.trim();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }
  if (!to) {
    return NextResponse.json({ error: 'Adresse destinataire requise.' }, { status: 400 });
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Le passage du Feu — rituel gratuit samedi, 15 places',
    html: HTML,
  });

  if (error) {
    return NextResponse.json({ ok: false, erreur: error.message ?? String(error) }, { status: 502 });
  }
  return NextResponse.json({ ok: true, id: data?.id, to, from: FROM });
}
