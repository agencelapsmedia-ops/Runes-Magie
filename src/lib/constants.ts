/**
 * Constantes partagées de la boutique.
 *
 * Source unique de vérité pour l'adresse physique, utilisée à la fois dans
 * les emails de confirmation et les événements Google Agenda. À modifier ici
 * uniquement si l'adresse change.
 */

/** Nom commercial affiché. */
export const BOUTIQUE_NAME = 'Runes & Magie';

/** Adresse postale complète (une seule ligne — géolocalisable par Google). */
export const BOUTIQUE_ADDRESS = '149 Rue Saint-Eustache, Saint-Eustache, QC J7R 2L5';

/** Adresse préfixée du nom commercial — pour affichage et géolocalisation. */
export const BOUTIQUE_LOCATION = `${BOUTIQUE_NAME}, ${BOUTIQUE_ADDRESS}`;
