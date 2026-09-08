/**
 * Notes d'un rendez-vous (HolisticAppointment.notes).
 *
 * Format stocké, identique pour le parcours public et le RDV manuel du calendrier :
 *
 *   Service : Tirage Runes Futhark & Cartes
 *   Mode : Présentiel
 *   texte libre de la praticienne…
 *
 * Les deux premières lignes forment l'EN-TÊTE : elles sont lues par les courriels,
 * les reçus (serviceFromNotes) et la synchro Google Agenda. Elles ne doivent donc
 * jamais être perdues quand on modifie le texte libre.
 */

const LIGNE_ENTETE = /^\s*(Service|Mode)\s*:\s*(.+)$/;

export interface NotesDecomposees {
  /** Lignes « Service : … » et « Mode : … », dans l'ordre, telles quelles. */
  entete: string[];
  service: string | null;
  mode: string | null;
  /** Ce que la praticienne a écrit elle-même (null si rien). */
  libre: string | null;
}

export function decomposerNotes(notes: string | null | undefined): NotesDecomposees {
  const entete: string[] = [];
  let service: string | null = null;
  let mode: string | null = null;
  const libres: string[] = [];
  for (const ligne of (notes ?? '').split('\n')) {
    const m = ligne.match(LIGNE_ENTETE);
    if (m && m[1] === 'Service' && service === null) {
      service = m[2].trim();
      entete.push(ligne.trim());
    } else if (m && m[1] === 'Mode' && mode === null) {
      mode = m[2].trim();
      entete.push(ligne.trim());
    } else {
      libres.push(ligne);
    }
  }
  return { entete, service, mode, libre: libres.join('\n').trim() || null };
}

/** Remplace le texte libre en conservant l'en-tête des notes existantes. */
export function recomposerNotes(notesExistantes: string | null | undefined, libre: string): string | null {
  const { entete } = decomposerNotes(notesExistantes);
  const texte = libre.trim();
  const lignes = [...entete, ...(texte ? [texte] : [])];
  return lignes.length > 0 ? lignes.join('\n') : null;
}
