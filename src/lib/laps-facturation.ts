/**
 * Facturation Laps Media — un seul endroit pour les calculs d'argent et de durée.
 *
 * Les durées sont stockées en MINUTES ENTIÈRES (jamais en heures décimales : 1 h 20
 * n'est pas 1,2 h). Les montants sont des dollars en Float, comme partout ailleurs
 * dans le schéma, arrondis au cent à chaque étape pour que la somme affichée
 * corresponde exactement à la somme des lignes affichées.
 */

/** Taux horaire par défaut d'une nouvelle action. */
export const TAUX_HORAIRE = 74.99;

/** Modes de versement acceptés pour un paiement. */
export const METHODES_PAIEMENT = ['INTERAC', 'VIREMENT', 'COMPTANT', 'AUTRE'];

/** Libellé affiché de chaque mode de versement. */
export const LIBELLE_METHODE: Record<string, string> = {
  INTERAC: 'Interac',
  VIREMENT: 'Virement',
  COMPTANT: 'Comptant',
  AUTRE: 'Autre',
};

export type ActionFacturable = {
  minutes: number;
  hourlyRate: number;
  billable: boolean;
};

export type PaiementRecu = {
  amount: number;
};

/** Arrondi au cent — évite les 187,47999999 dans les totaux. */
export function auCent(montant: number): number {
  return Math.round(montant * 100) / 100;
}

/** Montant d'une action : minutes × taux horaire, au cent près. */
export function montantAction(a: { minutes: number; hourlyRate: number }): number {
  return auCent((a.minutes / 60) * a.hourlyRate);
}

/** « 2 h 30 », « 3 h », « 45 min », « 0 min ». */
export function dureeLisible(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

/** Heures décimales, pour l'affichage des totaux du rapport (« 12,5 h »). */
export function heuresLisibles(minutes: number): string {
  return `${(minutes / 60).toFixed(2).replace('.', ',')} h`;
}

/** Montant formaté à la québécoise, comme le reste de l'admin. */
export function montantLisible(montant: number): string {
  return `${montant.toFixed(2)} $`;
}

export type Bilan = {
  minutesFacturables: number;
  minutesNonFacturables: number;
  totalFacture: number;
  totalPaye: number;
  solde: number;
};

/**
 * Bilan global. Les heures NON facturables ne comptent que pour le rapport :
 * elles n'entrent ni dans le total facturé ni dans le solde dû.
 */
export function bilan(actions: ActionFacturable[], paiements: PaiementRecu[]): Bilan {
  let minutesFacturables = 0;
  let minutesNonFacturables = 0;
  let totalFacture = 0;

  for (const a of actions) {
    if (a.billable) {
      minutesFacturables += a.minutes;
      totalFacture += montantAction(a);
    } else {
      minutesNonFacturables += a.minutes;
    }
  }

  const totalPaye = paiements.reduce((somme, p) => somme + p.amount, 0);
  return {
    minutesFacturables,
    minutesNonFacturables,
    totalFacture: auCent(totalFacture),
    totalPaye: auCent(totalPaye),
    solde: auCent(totalFacture - totalPaye),
  };
}

/** Clé de mois « 2026-09 » d'une date, en heure de Montréal. */
export function cleMois(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const an = parts.find((p) => p.type === 'year')?.value ?? '';
  const mois = parts.find((p) => p.type === 'month')?.value ?? '';
  return `${an}-${mois}`;
}

/** « septembre 2026 » à partir d'une clé « 2026-09 ». */
export function moisLisible(cle: string): string {
  const [an, mois] = cle.split('-').map(Number);
  const d = new Date(Date.UTC(an, mois - 1, 15, 12));
  const texte = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    month: 'long',
    year: 'numeric',
  }).format(d);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
