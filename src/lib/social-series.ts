/**
 * Catalogue des séries de génération de masse. Données pures, partagées entre
 * l'interface (modale « Générer une série ») et le moteur (social-generate).
 */

export interface SerieContenu {
  cle: string;
  label: string;
  description: string;
  /** Kinds de matière première utilisés (vide = série pilotée par consignes). */
  kinds: string[];
  /** Gabarit visuel proposé par défaut. */
  templateDefaut: string;
  /** Type de SocialPost créé. */
  typePost: string;
}

export const SERIES_CONTENU: SerieContenu[] = [
  {
    cle: 'RUNE_DU_JOUR',
    label: 'Rune du jour',
    description: 'Une publication par rune du Futhark (glyphe, sens, phrase clé).',
    kinds: ['RUNE'],
    templateDefaut: 'RUNE_DU_JOUR',
    typePost: 'PUBLICATION',
  },
  {
    cle: 'MYTHOLOGIE',
    label: 'Mythologie nordique',
    description: 'Récits et figures du corpus mythologique (85 notes).',
    kinds: ['MYTHOLOGIE'],
    templateDefaut: 'CITATION',
    typePost: 'PUBLICATION',
  },
  {
    cle: 'CITATIONS',
    label: 'Citations',
    description: 'Citations inspirantes tirées du corpus (runes et mythologie).',
    kinds: ['RUNE', 'MYTHOLOGIE'],
    templateDefaut: 'CITATION',
    typePost: 'CITATION',
  },
  {
    cle: 'PROMOS',
    label: 'Promotions (sur consignes)',
    description: 'Publications promotionnelles à partir de tes consignes.',
    kinds: [],
    templateDefaut: 'PROMO',
    typePost: 'PROMO_SOIN',
  },
  {
    cle: 'LIBRE',
    label: 'Série libre (sur consignes)',
    description: 'Publications variées à partir de tes consignes.',
    kinds: [],
    templateDefaut: 'ANNONCE',
    typePost: 'PUBLICATION',
  },
];

export const SERIES_CONTENU_CLES = SERIES_CONTENU.map((s) => s.cle);
