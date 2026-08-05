import { Prisma, type EventRegistration } from '@prisma/client';
import { prisma } from '@/lib/db';

export class EvenementIntrouvable extends Error {}
export class EvenementIndisponible extends Error {}
export class EvenementPasse extends Error {}
export class EvenementComplet extends Error {}
export class DejaInscrit extends Error {}

export interface ParamsInscription {
  eventId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  note: string | null;
}

export async function placesRestantes(eventId: string): Promise<number> {
  const [evenement, pris] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { capacity: true } }),
    prisma.eventRegistration.count({ where: { eventId, status: 'CONFIRMED' } }),
  ]);
  if (!evenement) return 0;
  return Math.max(0, evenement.capacity - pris);
}

/**
 * Rejoue une transaction annulée par Postgres pour cause de conflit de
 * sérialisation (Prisma P2034). En isolation Serializable, deux inscriptions
 * simultanées sur la dernière place font échouer l'une des deux : c'est le
 * comportement voulu, mais il faut la rejouer pour qu'elle constate le
 * « complet » plutôt que de renvoyer une erreur technique.
 */
async function avecReessais<T>(operation: () => Promise<T>, maximum = 20): Promise<T> {
  let derniereErreur: unknown;
  for (let essai = 0; essai < maximum; essai++) {
    try {
      return await operation();
    } catch (erreur) {
      const conflit =
        erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === 'P2034';
      if (!conflit) throw erreur;
      derniereErreur = erreur;
      // Gigue aléatoire en plus du backoff linéaire : sur le pooler Supabase
      // (pgbouncer, mode transaction), des délais synchronisés font retenter
      // plusieurs transactions au même instant et prolongent les conflits.
      const gigue = Math.random() * 25;
      await new Promise((resoudre) => setTimeout(resoudre, 25 * (essai + 1) + gigue));
    }
  }
  throw derniereErreur;
}

/**
 * Inscrit une personne à un événement.
 *
 * La vérification du nombre de places et l'insertion se font dans UNE SEULE
 * transaction en isolation Serializable. Un `count()` suivi d'un `create()`
 * hors transaction laisserait passer deux inscriptions sur la dernière place.
 */
export async function inscrire(params: ParamsInscription): Promise<EventRegistration> {
  return avecReessais(() =>
    prisma.$transaction(
      async (tx) => {
        const evenement = await tx.event.findUnique({ where: { id: params.eventId } });
        if (!evenement) throw new EvenementIntrouvable();
        if (!evenement.isPublished || evenement.cancelledAt) throw new EvenementIndisponible();
        if (evenement.startsAt.getTime() < Date.now()) throw new EvenementPasse();

        const existante = await tx.eventRegistration.findUnique({
          where: { eventId_userId: { eventId: params.eventId, userId: params.userId } },
        });
        if (existante && existante.status === 'CONFIRMED') throw new DejaInscrit();

        const pris = await tx.eventRegistration.count({
          where: { eventId: params.eventId, status: 'CONFIRMED' },
        });
        if (pris >= evenement.capacity) throw new EvenementComplet();

        // Réinscription après annulation : on réactive la ligne existante.
        // La contrainte @@unique([eventId, userId]) interdit d'en créer une seconde.
        if (existante) {
          return tx.eventRegistration.update({
            where: { id: existante.id },
            data: {
              status: 'CONFIRMED',
              cancelledAt: null,
              reminderSentAt: null,
              note: params.note,
              phone: params.phone,
              email: params.email,
              firstName: params.firstName,
              lastName: params.lastName,
            },
          });
        }

        return tx.eventRegistration.create({ data: { ...params, status: 'CONFIRMED' } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );
}

/**
 * Annule une inscription à partir de son jeton. Idempotente : un jeton déjà
 * utilisé renvoie l'inscription telle quelle plutôt que d'échouer.
 *
 * `dejaAnnulee` indique si l'inscription était déjà annulée AVANT cet appel,
 * pour permettre à l'appelant de ne pas renvoyer de courriel sur un second
 * clic (aucun changement d'état ne s'est produit).
 */
export async function annulerParJeton(token: string) {
  const inscription = await prisma.eventRegistration.findUnique({
    where: { cancelToken: token },
    include: { event: true },
  });
  if (!inscription) return null;
  if (inscription.status === 'CANCELLED') return { inscription, dejaAnnulee: true };

  const miseAJour = await prisma.eventRegistration.update({
    where: { id: inscription.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: { event: true },
  });
  return { inscription: miseAJour, dejaAnnulee: false };
}

export async function annulerParMembre(registrationId: string, userId: string) {
  const resultat = await prisma.eventRegistration.updateMany({
    where: { id: registrationId, userId, status: 'CONFIRMED' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  return resultat.count === 1;
}

/** Formate « samedi 8 août 2026 à 13 h » pour l'affichage et les courriels. */
export function formaterDateEvenement(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  }).format(date);
}
