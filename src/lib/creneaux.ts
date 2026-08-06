import { prisma } from '@/lib/db';
import { getEvenementsOccupes } from '@/lib/google-calendar';
import { instantEst } from '@/lib/fuseau';

export interface Creneau {
  /** Heure locale affichable, ex. « 13:15 ». */
  debut: string;
  /** Instant exact, à renvoyer tel quel à la route de création. */
  debutIso: string;
  disponible: boolean;
  /** Pourquoi le créneau est pris. Absent s'il est libre. */
  motif?: 'RENDEZ_VOUS' | 'AGENDA_PERSONNEL';
  /** Nom de l'événement personnel, pour l'avertissement. */
  etiquette?: string;
}

export interface ResultatCreneaux {
  creneaux: Creneau[];
  /** false si l'agenda Google n'a pas pu être consulté : l'interface doit le dire. */
  agendaGoogleConsulte: boolean;
}

/** Découpe un bloc « 10:45 »–« 12:15 » en départs possibles, pas de 15 minutes. */
function departsPossibles(debut: string, fin: string, dureeMinutes: number): string[] {
  const [hD, mD] = debut.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  const depart = hD * 60 + mD;
  const finBloc = hF * 60 + mF;
  const sorties: string[] = [];
  for (let t = depart; t + dureeMinutes <= finBloc; t += 15) {
    sorties.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return sorties;
}

export async function calculerCreneaux(params: {
  practitionerId: string;
  /** « 2026-08-11 » */
  date: string;
  offeringId: string;
}): Promise<ResultatCreneaux> {
  const { practitionerId, date, offeringId } = params;

  const offering = await prisma.offering.findUnique({
    where: { id: offeringId },
    select: { durationMinutes: true, practitionerId: true },
  });
  if (!offering || offering.practitionerId !== practitionerId) {
    return { creneaux: [], agendaGoogleConsulte: false };
  }
  const duree = offering.durationMinutes;

  const jour = new Date(`${date}T12:00:00Z`).getUTCDay();
  const debutJournee = instantEst(date, '00:00');
  const finJournee = new Date(debutJournee.getTime() + 24 * 3600 * 1000);

  // 1) Les blocs déclarés : récurrents du bon jour, ou ponctuels à cette date.
  const dispos = await prisma.holisticAvailability.findMany({
    where: {
      practitionerId,
      isActive: true,
      OR: [
        { date: null, dayOfWeek: jour },
        { date: { gte: debutJournee, lt: finJournee } },
      ],
    },
    orderBy: { startTime: 'asc' },
  });

  // 2) Les rendez-vous déjà pris ce jour-là.
  const rdv = await prisma.holisticAppointment.findMany({
    where: {
      practitionerId,
      status: { not: 'CANCELLED' },
      startsAt: { lt: finJournee },
      endsAt: { gt: debutJournee },
    },
    select: { startsAt: true, endsAt: true },
  });

  // 3) L'agenda Google. `getEvenementsOccupes` (events.list) plutôt que
  //    `getBusyPeriods` (freebusy) : freebusy ne renvoie jamais de titre
  //    d'événement (limite de cette API, quel que soit le scope OAuth) et ne
  //    permet pas de distinguer « agenda consulté, rien d'occupé » de
  //    « agenda injoignable » — elle renvoie [] dans les deux cas, ce qui
  //    empêcherait tout avertissement quand Google est réellement injoignable.
  //    Un échec ne doit jamais vider la liste des créneaux : mieux vaut des
  //    créneaux à vérifier qu'un écran vide, mais l'interface doit savoir si
  //    la vérification a eu lieu (agendaGoogleConsulte).
  let occupes: Array<{ start: string; end: string; titre: string }> = [];
  let agendaGoogleConsulte = false;
  try {
    const resultat = await getEvenementsOccupes(practitionerId, debutJournee, finJournee);
    occupes = resultat.periodes;
    agendaGoogleConsulte = resultat.consulte;
  } catch (err) {
    console.error('[creneaux] agenda Google injoignable (non bloquant)', err);
  }

  const creneaux: Creneau[] = [];
  for (const bloc of dispos) {
    for (const heure of departsPossibles(bloc.startTime, bloc.endTime, duree)) {
      const debutIso = instantEst(date, heure);
      const fin = new Date(debutIso.getTime() + duree * 60 * 1000);

      const prisParRdv = rdv.some((r) => r.startsAt < fin && r.endsAt > debutIso);
      const perso = occupes.find((o) => new Date(o.start) < fin && new Date(o.end) > debutIso);

      creneaux.push({
        debut: heure,
        debutIso: debutIso.toISOString(),
        // Un événement personnel n'interdit pas : il avertit (voir §8 du devis).
        disponible: !prisParRdv,
        motif: prisParRdv ? 'RENDEZ_VOUS' : perso ? 'AGENDA_PERSONNEL' : undefined,
        etiquette: !prisParRdv && perso ? (perso.titre || 'Événement personnel') : undefined,
      });
    }
  }

  // Les créneaux déjà passés n'ont pas d'intérêt.
  const maintenant = Date.now();
  return {
    creneaux: creneaux.filter((c) => new Date(c.debutIso).getTime() > maintenant),
    agendaGoogleConsulte,
  };
}
