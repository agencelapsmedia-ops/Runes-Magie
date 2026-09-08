/**
 * Page de retour après le consentement Google Agenda.
 *
 * Le bandeau « Connecter Google Agenda » existe à deux endroits (pupitre
 * praticien et /admin/calendrier) : on embarque la page d'origine dans le
 * `state` OAuth pour y revenir. Seuls des chemins locaux sont acceptés — un
 * `retour` forgé ne peut pas envoyer la praticienne vers un autre site.
 */
export const RETOUR_GOOGLE_DEFAUT = '/soins/dashboard/praticien';

/** Chemin local sûr (« /admin/calendrier »), sinon le pupitre par défaut. */
export function nettoyerRetourGoogle(retour: string | null | undefined): string {
  if (!retour) return RETOUR_GOOGLE_DEFAUT;
  if (!retour.startsWith('/') || retour.startsWith('//') || retour.includes('\\')) {
    return RETOUR_GOOGLE_DEFAUT;
  }
  // Pas de query ni de fragment : le callback ajoute lui-même ?google=…
  return retour.split(/[?#]/)[0] || RETOUR_GOOGLE_DEFAUT;
}

export function encoderEtatGoogle(practitionerId: string, retour: string): string {
  return Buffer.from(JSON.stringify({ p: practitionerId, r: nettoyerRetourGoogle(retour) })).toString(
    'base64url',
  );
}

/** Retour porté par le `state` ; ancien format (id brut) ou state absent → pupitre. */
export function decoderRetourGoogle(state: string | null): string {
  if (!state) return RETOUR_GOOGLE_DEFAUT;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { r?: unknown };
    return nettoyerRetourGoogle(typeof parsed.r === 'string' ? parsed.r : null);
  } catch {
    return RETOUR_GOOGLE_DEFAUT;
  }
}
