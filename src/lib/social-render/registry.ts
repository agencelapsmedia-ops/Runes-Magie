/**
 * Catalogue des gabarits de visuels générables (montages graphiques auto).
 * Consommé par l'interface (choix du gabarit + champs à remplir) et par la
 * génération de masse (choix automatique des champs depuis la matière).
 */

export interface ChampGabarit {
  cle: string;
  label: string;
  multiligne?: boolean;
  optionnel?: boolean;
  placeholder?: string;
}

export interface FormatVisuel {
  cle: 'PORTRAIT' | 'CARRE' | 'STORY';
  label: string;
  largeur: number;
  hauteur: number;
}

export const FORMATS_VISUELS: FormatVisuel[] = [
  { cle: 'PORTRAIT', label: 'Portrait 4:5 (fil FB/IG)', largeur: 1080, hauteur: 1350 },
  { cle: 'CARRE', label: 'Carré 1:1', largeur: 1080, hauteur: 1080 },
  { cle: 'STORY', label: 'Vertical 9:16 (story/reel)', largeur: 1080, hauteur: 1920 },
];

export interface GabaritVisuel {
  cle: string;
  label: string;
  description: string;
  champs: ChampGabarit[];
}

export const GABARITS_VISUELS: GabaritVisuel[] = [
  {
    cle: 'RUNE_DU_JOUR',
    label: 'Rune du jour',
    description: 'Glyphe géant, nom de la rune, surnom et phrase clé.',
    champs: [
      { cle: 'glyphe', label: 'Glyphe runique', placeholder: 'ᚱ' },
      { cle: 'titre', label: 'Nom de la rune', placeholder: 'Raido' },
      { cle: 'sousTitre', label: 'Surnom', optionnel: true, placeholder: 'Rune de l’Aventure' },
      { cle: 'texte', label: 'Phrase clé', multiligne: true, optionnel: true, placeholder: 'Le cavalier lancé vers la plus grande des aventures…' },
    ],
  },
  {
    cle: 'CITATION',
    label: 'Citation',
    description: 'Grande citation entre guillemets avec attribution.',
    champs: [
      { cle: 'texte', label: 'Citation', multiligne: true, placeholder: 'Le contrôle n’est qu’une illusion humaine.' },
      { cle: 'auteur', label: 'Attribution', optionnel: true, placeholder: 'Sagesse nordique' },
    ],
  },
  {
    cle: 'PROMO',
    label: 'Promotion',
    description: 'Titre accrocheur, texte court et bouton d’appel à l’action.',
    champs: [
      { cle: 'titre', label: 'Titre', placeholder: 'Formation runique' },
      { cle: 'texte', label: 'Texte', multiligne: true, optionnel: true, placeholder: 'Découvre les 24 runes du Futhark…' },
      { cle: 'cta', label: 'Appel à l’action', optionnel: true, placeholder: 'Réserve ta place' },
    ],
  },
  {
    cle: 'ANNONCE',
    label: 'Annonce / événement',
    description: 'Titre, date mise en valeur et détails.',
    champs: [
      { cle: 'titre', label: 'Titre', placeholder: 'Veillée de pleine lune' },
      { cle: 'date', label: 'Date affichée', optionnel: true, placeholder: 'Vendredi 3 octobre · 19 h' },
      { cle: 'texte', label: 'Détails', multiligne: true, optionnel: true, placeholder: 'Au Temple Runes & Magie, Saint-Eustache.' },
    ],
  },
];

export const GABARITS_VISUELS_CLES = GABARITS_VISUELS.map((g) => g.cle);
