/**
 * ROUTE TEMPORAIRE — diffusion du courriel d'invitation au Rituel des Justes de voix.
 * Le contenu du courriel vit dans src/lib/courriel-invitation-rituel.ts.
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
import { SUJET_INVITATION, htmlInvitationRituel } from '@/lib/courriel-invitation-rituel';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const SUJET = SUJET_INVITATION;

function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

const html = htmlInvitationRituel;

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
