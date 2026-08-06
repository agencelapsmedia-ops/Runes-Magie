/**
 * fuseau.ts — Conversion fuseau horaire pour l'agenda (America/Toronto).
 *
 * Module partagé entre `creneaux.ts` (calcul des créneaux libres) et
 * `google-calendar.ts` (agenda personnel de la praticienne) : les deux
 * avaient besoin de la même conversion « date civile + heure locale de
 * Toronto → instant UTC exact », et deux copies indépendantes de cet
 * algorithme risquaient de diverger en silence si l'une était corrigée sans
 * l'autre (ex. un correctif de bascule d'heure avancée appliqué à une seule
 * des deux). C'est le défaut qui coûterait le plus cher : des clientes qui
 * se présentent à la mauvaise heure.
 *
 * Ni `creneaux.ts` ni `google-calendar.ts` n'important ce module l'un via
 * l'autre : aucun cycle.
 */

export const FUSEAU_EST = 'America/Toronto';

/**
 * « 2026-08-11 » + « 13:15 » (heure locale de Toronto) → instant UTC exact.
 * Heure omise (défaut « 00:00 ») → minuit heure de Toronto pour cette date.
 *
 * On part d'une estimation UTC, on lit l'heure qu'elle donne à Toronto, et on
 * corrige de l'écart. Deux passes suffisent, y compris aux bascules d'heure
 * avancée. Ne jamais coder -4 ou -5 en dur ; ne jamais passer une chaîne sans
 * fuseau à `new Date()`.
 */
export function instantEst(date: string, heure = '00:00'): Date {
  const [an, mois, jour] = date.split('-').map(Number);
  const [h, min] = heure.split(':').map(Number);
  let estimation = Date.UTC(an, mois - 1, jour, h, min);
  for (let passe = 0; passe < 2; passe++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSEAU_EST, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(estimation));
    const lu = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const obtenu = Date.UTC(lu('year'), lu('month') - 1, lu('day'), lu('hour') % 24, lu('minute'));
    const ecart = Date.UTC(an, mois - 1, jour, h, min) - obtenu;
    if (ecart === 0) break;
    estimation += ecart;
  }
  return new Date(estimation);
}
