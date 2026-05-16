import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/infolettre/unsubscribe?token=XXX
 *
 * Désabonne un abonné via son token unique (envoyé dans chaque email).
 * Conforme Loi 25 (Québec) + LCAP — un clic, pas d'authentification, idempotent.
 *
 * Retourne JSON pour l'usage programmatique. Pour l'usage utilisateur final,
 * la page publique /infolettre/desabonnement appelle cette route puis affiche
 * un message de confirmation.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return NextResponse.json({ error: 'Token invalide ou déjà utilisé' }, { status: 404 });
  }

  // Idempotent : si déjà désabonné, on retourne success quand même
  if (subscriber.unsubscribedAt) {
    return NextResponse.json({
      success: true,
      alreadyUnsubscribed: true,
      email: subscriber.email,
    });
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      unsubscribedAt: new Date(),
      consentEmail: false,
    },
  });

  return NextResponse.json({
    success: true,
    alreadyUnsubscribed: false,
    email: subscriber.email,
  });
}
