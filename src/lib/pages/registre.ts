import { CHAMPS_CEREMONIES } from './ceremonies';

/**
 * Registre des gabarits de pages éditoriales.
 *
 * `SitePage.template` désigne le gabarit qui rend la page ; c'est lui qui
 * détermine quels champs sont acceptés dans `SitePage.content`. Sans ce
 * registre, la route d'enregistrement devrait faire confiance au navigateur
 * et laisserait écrire n'importe quelle clé dans le JSON.
 *
 * Pour ajouter un gabarit : créer son module dans `src/lib/pages/`, exporter la
 * liste de ses champs, et ajouter une ligne ici.
 */
export interface GabaritPage {
  /** Champs autorisés dans `content` pour ce gabarit. */
  champs: ReadonlySet<string>;
}

export const GABARITS: Record<string, GabaritPage> = {
  ceremonies: { champs: new Set<string>(CHAMPS_CEREMONIES as readonly string[]) },
};

export function trouverGabarit(nom: string): GabaritPage | null {
  return GABARITS[nom] ?? null;
}
