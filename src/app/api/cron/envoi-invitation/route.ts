/**
 * ROUTE TEMPORAIRE — diffusion du courriel d'invitation au rituel de Lughnasadh.
 * À SUPPRIMER une fois la diffusion terminée, ou à remplacer par une vraie
 * fonction d'infolettre dans l'administration.
 *
 * Protégée par CRON_SECRET. Placée sous /api/cron/ pour hériter de la même
 * convention d'authentification ; elle n'est PAS déclarée dans vercel.json et
 * ne s'exécute donc jamais automatiquement.
 *
 * POST { to: "adresse" }                    → envoi unitaire (test)
 * POST { audience: "infolettre", debut, taille } → diffusion par tranches
 * GET  ?id=<identifiant Resend>             → état de livraison d'un envoi
 *
 * Les tranches sont nécessaires : le plan Vercel Hobby coupe une route à 60 s,
 * et on espace les envois de 600 ms pour respecter le débit autorisé par Resend
 * (2 requêtes/seconde).
 */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { unsubscribeUrl } from '@/lib/infolettre';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const SUJET = 'Noctura vous invite — le passage du Feu, samedi';

function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Construit le courriel avec le lien de désabonnement propre au destinataire. */
function html(lienDesabonnement: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;">
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
    <p style="margin:0;font-size:11px;">Vous recevez ce courriel car vous êtes inscrit(e) à notre infolettre.<br /><a href="${lienDesabonnement}" style="color:rgba(46,196,182,0.7);text-decoration:underline;">Se désabonner en un clic</a></p>
    <p style="margin:8px 0 0;font-size:10px;color:rgba(245,240,232,0.25);font-style:italic;">Conforme Loi 25 (Québec) et LCAP. Désabonnement immédiat et définitif.</p>
  </div>
</div>
</body></html>`;
}

export async function GET(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;

  // ?apercu=1 → composition de l'audience, sans rien envoyer.
  if (params.get('apercu')) {
    const total = await prisma.newsletterSubscriber.count({
      where: { unsubscribedAt: null, consentEmail: true },
    });
    return NextResponse.json({ destinatairesEligibles: total, sujet: SUJET, expediteur: FROM });
  }

  const id = params.get('id');
  if (!id) return NextResponse.json({ error: 'Parametre id ou apercu requis.' }, { status: 400 });
  const reponse = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ''}` },
  });
  const corps = await reponse.json();
  return NextResponse.json({ statutHttp: reponse.status, resend: corps });
}

export async function POST(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  if (!resend) {
    return NextResponse.json({ error: 'RESEND_API_KEY absente' }, { status: 500 });
  }

  let corps: { to?: unknown; audience?: unknown; debut?: unknown; taille?: unknown };
  try {
    corps = (await req.json()) as typeof corps;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  // Mode 1 : envoi unitaire de test.
  if (typeof corps.to === 'string' && corps.to.trim()) {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: corps.to.trim(),
      subject: SUJET,
      html: html('https://www.runesetmagie.ca/infolettre'),
    });
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 502 });
    return NextResponse.json({ ok: true, id: data?.id, to: corps.to.trim() });
  }

  // Mode 2 : diffusion par tranches à l'infolettre.
  if (corps.audience !== 'infolettre') {
    return NextResponse.json({ error: 'Preciser to, ou audience: "infolettre".' }, { status: 400 });
  }

  const debut = Number.isInteger(corps.debut) ? (corps.debut as number) : 0;
  const taille = Number.isInteger(corps.taille) ? Math.min(corps.taille as number, 25) : 20;

  const destinataires = await prisma.newsletterSubscriber.findMany({
    where: { unsubscribedAt: null, consentEmail: true },
    select: { email: true, unsubscribeToken: true },
    orderBy: { createdAt: 'asc' },
    skip: debut,
    take: taille,
  });

  let envoyes = 0;
  const echecs: { email: string; raison: string }[] = [];

  for (const [index, d] of destinataires.entries()) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: d.email,
        subject: SUJET,
        html: html(unsubscribeUrl(d.unsubscribeToken)),
      });
      if (error) throw new Error(error.message ?? String(error));
      envoyes++;
    } catch (erreur) {
      const raison = erreur instanceof Error ? erreur.message : String(erreur);
      console.error('[Invitation] Echec pour', d.email, raison);
      echecs.push({ email: d.email, raison });
    }
    // Débit Resend : 2 requêtes/seconde. On espace, sauf après le dernier.
    if (index < destinataires.length - 1) await attendre(600);
  }

  const restants = await prisma.newsletterSubscriber.count({
    where: { unsubscribedAt: null, consentEmail: true },
  });

  return NextResponse.json({
    tranche: { debut, taille, traites: destinataires.length },
    envoyes,
    echecs,
    prochainDebut: debut + destinataires.length,
    totalEligibles: restants,
    termine: debut + destinataires.length >= restants,
  });
}
