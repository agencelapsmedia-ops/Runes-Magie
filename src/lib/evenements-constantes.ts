/**
 * Constantes des événements partagées entre le serveur et le navigateur.
 *
 * Fichier séparé de `lib/evenements.ts` à dessein : celui-ci importe Prisma et
 * ne peut donc pas être chargé par un composant client.
 */

/** Plafond d'accompagnateurs qu'une inscrite peut amener. */
export const MAX_ACCOMPAGNATEURS = 5;
