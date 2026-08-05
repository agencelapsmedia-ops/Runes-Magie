import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { envoyerRappel } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

/**
 * Cron quotidien (9h Est) : rappelle les événements des 48 prochaines heures.
 *
 * Fenêtre de 48 h et non 24 h : le plan Vercel Hobby n'autorise QU'UN passage
 * par jour, donc une fenêtre de 24 h manquerait des événements. `reminderSentAt`
 * garantit qu'un rappel n'est jamais envoyé deux fois.
 */
export async function GET(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const maintenant = new Date();
  const limite = new Date(maintenant.getTime() + 48 * 3600 * 1000);

  const inscriptions = await prisma.eventRegistration.findMany({
    where: {
      status: 'CONFIRMED',
      reminderSentAt: null,
      event: { cancelledAt: null, isPublished: true, startsAt: { gte: maintenant, lte: limite } },
    },
    include: { event: true },
    take: 200,
  });

  let envoyes = 0;
  const echecs: string[] = [];

  for (const inscription of inscriptions) {
    try {
      await envoyerRappel({
        prenom: inscription.firstName,
        nom: inscription.lastName,
        courriel: inscription.email,
        titre: inscription.event.title,
        debut: inscription.event.startsAt,
        lieu: inscription.event.location,
        enLigne: inscription.event.isOnline,
        lienEnLigne: inscription.event.onlineUrl,
        aApporter: inscription.event.bringItems,
        jetonAnnulation: inscription.cancelToken,
      });
      // Marqué seulement après un envoi réussi : un échec sera retenté demain.
      await prisma.eventRegistration.update({
        where: { id: inscription.id },
        data: { reminderSentAt: new Date() },
      });
      envoyes++;
    } catch (erreur) {
      console.error('[Rappels] Echec pour', inscription.email, erreur);
      echecs.push(inscription.email);
    }
  }

  return NextResponse.json({ traitees: inscriptions.length, envoyes, echecs: echecs.length });
}
