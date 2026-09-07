import { Prisma, type EventRegistration } from '@prisma/client';
import { prisma } from '@/lib/db';
import { MAX_ACCOMPAGNATEURS } from '@/lib/evenements-constantes';

export class EvenementIntrouvable extends Error {}
export class EvenementIndisponible extends Error {}
export class EvenementPasse extends Error {}
export class EvenementComplet extends Error {}
export class DejaInscrit extends Error {}

export { MAX_ACCOMPAGNATEURS } from '@/lib/evenements-constantes';

export class TropDAccompagnateurs extends Error {}

export interface Accompagnateur {
  firstName: string;
  lastName: string;
  /** Facultatif : ces personnes n'ont pas de compte. */
  email: string | null;
}

export interface ParamsInscription {
  eventId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  note: string | null;
  /** Consentement à apparaître dans la liste publique « Le cercle ». */
  showPublicly: boolean;
  /** Personnes amenées par l'inscrite ; chacune occupe une place. */
  accompagnateurs: Accompagnateur[];
}

/**
 * Places occupées : une par inscription confirmée, plus une par accompagnateur.
 * La capacité compte des personnes dans la salle, pas des comptes membres.
 */
export async function placesOccupees(eventId: string): Promise<number> {
  const [inscrits, accompagnateurs] = await Promise.all([
    prisma.eventRegistration.count({ where: { eventId, status: 'CONFIRMED' } }),
    prisma.eventGuest.count({ where: { registration: { eventId, status: 'CONFIRMED' } } }),
  ]);
  return inscrits + accompagnateurs;
}

export async function placesRestantes(eventId: string): Promise<number> {
  const [evenement, pris] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { capacity: true } }),
    placesOccupees(eventId),
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

        if (params.accompagnateurs.length > MAX_ACCOMPAGNATEURS) {
          throw new TropDAccompagnateurs();
        }

        const existante = await tx.eventRegistration.findUnique({
          where: { eventId_userId: { eventId: params.eventId, userId: params.userId } },
        });
        if (existante && existante.status === 'CONFIRMED') throw new DejaInscrit();

        // Places prises = inscrites confirmées + leurs accompagnateurs. La
        // demande en cours occupe 1 place pour elle-même, plus une par personne
        // amenée : elle est refusée en bloc si le groupe ne rentre pas.
        const [inscrits, invites] = await Promise.all([
          tx.eventRegistration.count({
            where: { eventId: params.eventId, status: 'CONFIRMED' },
          }),
          tx.eventGuest.count({
            where: { registration: { eventId: params.eventId, status: 'CONFIRMED' } },
          }),
        ]);
        const demandees = 1 + params.accompagnateurs.length;
        if (inscrits + invites + demandees > evenement.capacity) throw new EvenementComplet();

        // Réinscription après annulation : on réactive la ligne existante.
        // La contrainte @@unique([eventId, userId]) interdit d'en créer une seconde.
        // Le consentement d'affichage public est repris de la nouvelle demande
        // (et non de l'ancienne inscription annulée) : la personne peut très
        // bien avoir changé d'avis entre les deux inscriptions.
        if (existante) {
          // Les accompagnateurs de l'inscription annulée sont remplacés par ceux
          // de la nouvelle demande : la personne ne vient pas forcément avec le
          // même monde qu'à sa première réservation.
          await tx.eventGuest.deleteMany({ where: { registrationId: existante.id } });
          return tx.eventRegistration.update({
            where: { id: existante.id },
            data: {
              status: 'CONFIRMED',
              cancelledAt: null,
              reminderSentAt: null,
              attendance: null,
              attendanceAt: null,
              note: params.note,
              phone: params.phone,
              email: params.email,
              firstName: params.firstName,
              lastName: params.lastName,
              showPublicly: params.showPublicly,
              guests: { create: params.accompagnateurs },
            },
          });
        }

        const { accompagnateurs, ...inscription } = params;
        return tx.eventRegistration.create({
          data: { ...inscription, status: 'CONFIRMED', guests: { create: accompagnateurs } },
        });
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
 *
 * La transition est rendue atomique via un `updateMany` conditionné par
 * `status: 'CONFIRMED'` (même principe que `annulerParMembre`) : si deux
 * clics sur le même lien arrivent en même temps, un seul obtient `count: 1`
 * et déclenche le courriel — l'autre constate `count: 0` et sait qu'il n'a
 * rien changé, sans dépendre d'une lecture préalable qui pourrait être
 * périmée avant l'écriture.
 */
export async function annulerParJeton(token: string) {
  const inscription = await prisma.eventRegistration.findUnique({
    where: { cancelToken: token },
    include: { event: true },
  });
  if (!inscription) return null;

  const resultat = await prisma.eventRegistration.updateMany({
    where: { cancelToken: token, status: 'CONFIRMED' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (resultat.count === 0) return { inscription, dejaAnnulee: true };

  // On relit pour renvoyer l'inscription à jour (cancelledAt, status) plutôt
  // que la version pré-transition capturée avant l'écriture.
  const miseAJour = await prisma.eventRegistration.findUniqueOrThrow({
    where: { cancelToken: token },
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
