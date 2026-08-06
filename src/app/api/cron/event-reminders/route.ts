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
    // Réserve AVANT d'envoyer, avec un `updateMany` conditionné par
    // `reminderSentAt: null` ET `status: 'CONFIRMED'` : c'est le même verrou
    // atomique que `annulerParMembre`/`annulerParJeton` dans
    // src/lib/evenements.ts. L'ordre paraît à l'envers — marquer avant
    // d'avoir réellement envoyé — mais c'est le seul moyen d'empêcher deux
    // exécutions concurrentes (ex. un test manuel qui chevauche le
    // déclenchement automatique de Vercel) de lire le même lot et d'envoyer
    // toutes les deux : seule l'exécution qui obtient `count === 1` a le
    // droit d'envoyer, l'autre voit `count === 0` et passe son tour. La
    // contrepartie est gérée plus bas : si l'envoi échoue après la
    // réservation, on remet `reminderSentAt` à `null` pour permettre un
    // nouvel essai demain.
    const reservation = await prisma.eventRegistration.updateMany({
      where: { id: inscription.id, status: 'CONFIRMED', reminderSentAt: null },
      data: { reminderSentAt: maintenant },
    });
    if (reservation.count === 0) {
      // Déjà réservée par une autre exécution, ou plus confirmée entre-temps.
      continue;
    }

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
      envoyes++;
    } catch (erreur) {
      console.error('[Rappels] Echec envoi pour', inscription.email, erreur);
      echecs.push(inscription.email);
      // On libère la réservation pour que le rappel soit retenté au prochain
      // passage. Si cette remise à zéro échoue elle aussi, on NE retente PAS
      // automatiquement : mieux vaut un rappel manquant qu'un doublon. On
      // journalise clairement l'adresse concernée pour qu'une intervention
      // manuelle reste possible.
      try {
        await prisma.eventRegistration.update({
          where: { id: inscription.id },
          data: { reminderSentAt: null },
        });
      } catch (erreurLiberation) {
        console.error(
          '[Rappels] Echec de la remise a zero de reminderSentAt pour',
          inscription.email,
          '- rappel possiblement perdu, verifier manuellement.',
          erreurLiberation,
        );
      }
    }
  }

  return NextResponse.json({ traitees: inscriptions.length, envoyes, echecs: echecs.length });
}
