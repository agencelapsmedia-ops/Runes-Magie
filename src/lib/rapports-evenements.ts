/**
 * Agrégation des rituels : qui vient, qui revient, qui se présente.
 *
 * Sert à la fois la page /admin/evenements/rapports et le PDF téléchargeable,
 * pour qu'un chiffre affiché à l'écran et le même chiffre imprimé ne puissent
 * jamais diverger.
 *
 * Deux notions à ne pas confondre :
 *   — inscription CONFIRMED = la personne a réservé sa place ;
 *   — présence (`attendance === 'PRESENT'`) = elle est effectivement venue,
 *     constaté par le pointage de Noctura le jour du rituel.
 * Un rituel non pointé n'a donc aucune présence, ce qui est différent de zéro
 * participant : les compteurs distinguent « absent » de « non pointé ».
 */
import { prisma } from '@/lib/db';

export interface LigneRituel {
  id: string;
  titre: string;
  debut: Date;
  capacite: number;
  confirmes: number;
  annulees: number;
  presents: number;
  absents: number;
  nonPointes: number;
  /** Confirmés / capacité, en pourcentage entier. */
  remplissage: number;
  /** Confirmés qui n'avaient jamais participé à un rituel antérieur. */
  nouveaux: number;
  revenants: number;
  /** Jours entre l'inscription et le rituel — médiane des confirmés. */
  delaiMedian: number | null;
  annule: boolean;
}

export interface LigneParticipant {
  userId: string;
  nom: string;
  courriel: string;
  inscriptions: number;
  presences: number;
  annulations: number;
  premier: Date;
  dernier: Date;
  /** Titres des rituels, du plus ancien au plus récent. */
  rituels: string[];
}

export interface RapportEvenements {
  debut: Date | null;
  fin: Date | null;
  genereLe: Date;
  global: {
    rituels: number;
    inscriptions: number;
    confirmees: number;
    annulees: number;
    participants: number;
    presences: number;
    /** Inscriptions confirmées à des rituels déjà pointés, pour situer `presences`. */
    pointees: number;
    remplissageMoyen: number;
    /** Participants venus à plus d'un rituel. */
    fideles: number;
  };
  rituels: LigneRituel[];
  participants: LigneParticipant[];
}

/** Médiane entière d'une série (retourne null si la série est vide). */
function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  const tri = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tri.length / 2);
  return tri.length % 2 === 0 ? Math.round((tri[milieu - 1] + tri[milieu]) / 2) : tri[milieu];
}

/**
 * Construit le rapport complet.
 *
 * `debut`/`fin` filtrent sur la date du rituel. Le calcul « nouveau vs revenant »
 * regarde en revanche TOUT l'historique, y compris hors période : quelqu'un venu
 * en août puis en octobre est un revenant en octobre, même si le rapport ne
 * porte que sur octobre. L'inverse ferait passer des habitués pour des nouveaux.
 */
export async function construireRapportEvenements(options?: {
  debut?: Date | null;
  fin?: Date | null;
}): Promise<RapportEvenements> {
  const debut = options?.debut ?? null;
  const fin = options?.fin ?? null;

  const evenements = await prisma.event.findMany({
    orderBy: { startsAt: 'asc' },
    include: {
      registrations: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });

  // Première participation de chaque personne, tous rituels confondus — base du
  // « nouveau vs revenant », calculée avant tout filtrage de période.
  const premiereFois = new Map<string, string>();
  for (const evenement of evenements) {
    for (const inscription of evenement.registrations) {
      if (inscription.status !== 'CONFIRMED') continue;
      if (!premiereFois.has(inscription.userId)) premiereFois.set(inscription.userId, evenement.id);
    }
  }

  const retenus = evenements.filter(
    (e) => (!debut || e.startsAt >= debut) && (!fin || e.startsAt <= fin),
  );

  const rituels: LigneRituel[] = retenus.map((evenement) => {
    const confirmes = evenement.registrations.filter((r) => r.status === 'CONFIRMED');
    const nouveaux = confirmes.filter((r) => premiereFois.get(r.userId) === evenement.id).length;
    const delais = confirmes.map((r) =>
      Math.max(0, Math.round((evenement.startsAt.getTime() - r.createdAt.getTime()) / 86_400_000)),
    );

    return {
      id: evenement.id,
      titre: evenement.title,
      debut: evenement.startsAt,
      capacite: evenement.capacity,
      confirmes: confirmes.length,
      annulees: evenement.registrations.filter((r) => r.status === 'CANCELLED').length,
      presents: confirmes.filter((r) => r.attendance === 'PRESENT').length,
      absents: confirmes.filter((r) => r.attendance === 'ABSENT').length,
      nonPointes: confirmes.filter((r) => !r.attendance).length,
      remplissage: evenement.capacity > 0 ? Math.round((confirmes.length / evenement.capacity) * 100) : 0,
      nouveaux,
      revenants: confirmes.length - nouveaux,
      delaiMedian: mediane(delais),
      annule: evenement.cancelledAt !== null,
    };
  });

  // Croisement par personne. Le regroupement se fait sur `userId` : une
  // inscription est toujours rattachée à un compte membre. Conséquence connue —
  // quelqu'un qui possède deux comptes (deux adresses) compte pour deux
  // participants ; c'est signalé sur la page de rapport.
  const parPersonne = new Map<string, LigneParticipant>();
  for (const evenement of retenus) {
    for (const inscription of evenement.registrations) {
      const existant = parPersonne.get(inscription.userId);
      const ligne: LigneParticipant = existant ?? {
        userId: inscription.userId,
        nom: `${inscription.firstName} ${inscription.lastName}`.trim(),
        courriel: inscription.email,
        inscriptions: 0,
        presences: 0,
        annulations: 0,
        premier: evenement.startsAt,
        dernier: evenement.startsAt,
        rituels: [],
      };

      if (inscription.status === 'CONFIRMED') {
        ligne.inscriptions += 1;
        ligne.rituels.push(evenement.title);
        if (inscription.attendance === 'PRESENT') ligne.presences += 1;
        if (evenement.startsAt < ligne.premier) ligne.premier = evenement.startsAt;
        if (evenement.startsAt > ligne.dernier) ligne.dernier = evenement.startsAt;
      } else {
        ligne.annulations += 1;
      }

      parPersonne.set(inscription.userId, ligne);
    }
  }

  const participants = [...parPersonne.values()].sort(
    (a, b) => b.inscriptions - a.inscriptions || b.presences - a.presences || a.nom.localeCompare(b.nom, 'fr'),
  );

  const confirmees = rituels.reduce((somme, r) => somme + r.confirmes, 0);
  const annulees = rituels.reduce((somme, r) => somme + r.annulees, 0);

  return {
    debut,
    fin,
    genereLe: new Date(),
    global: {
      rituels: rituels.length,
      inscriptions: confirmees + annulees,
      confirmees,
      annulees,
      participants: participants.filter((p) => p.inscriptions > 0).length,
      presences: rituels.reduce((somme, r) => somme + r.presents, 0),
      pointees: rituels.reduce((somme, r) => somme + r.presents + r.absents, 0),
      remplissageMoyen:
        rituels.length > 0
          ? Math.round(rituels.reduce((somme, r) => somme + r.remplissage, 0) / rituels.length)
          : 0,
      fideles: participants.filter((p) => p.inscriptions > 1).length,
    },
    rituels,
    participants,
  };
}

/** Date courte « 5 sept. 2026 » — colonnes de tableaux et de PDF. */
export function dateCourte(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Toronto',
  }).format(date);
}
