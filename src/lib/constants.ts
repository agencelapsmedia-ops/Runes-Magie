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

/**
 * Domaine interne NON routable (TLD `.invalid`, réservé RFC 2606) pour les clientes
 * créées sans courriel lors d'un RDV manuel. Aucun courriel n'est jamais envoyé à
 * une adresse de ce domaine (cf. `isInternalEmail` dans holistic-clients.ts).
 */
export const INTERNAL_EMAIL_DOMAIN = 'interne.invalid';

/** Virement Interac — paramètres affichés dans le courriel « infos de virement ». */
export const INTERAC_EMAIL = 'comptabilite@runesetmagie.ca';
export const INTERAC_MESSAGE = 'Inscrivez votre nom dans la description du virement.';
export const INTERAC_ANSWER = 'Magie123'; // réponse secrète / mot de passe du virement
