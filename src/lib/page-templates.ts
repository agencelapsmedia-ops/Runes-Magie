// ════════════════════════════════════════════════════════════════════════
// MODÈLES DE PAGES (templates) — source de vérité des champs éditables.
//
// Chaque modèle décrit les sections et les champs texte qu'un·e admin peut
// modifier dans « Gestion site web → Pages ». Les valeurs `default` servent à
// la fois de contenu de secours (si un champ n'a jamais été enregistré) et de
// pré-remplissage du formulaire d'édition.
//
// Pour ajouter un champ éditable : ajoute-le ici (clé + label + type + default),
// puis utilise sa valeur dans le composant/page qui le rend. Rien d'autre à
// câbler côté formulaire admin — il est généré automatiquement à partir d'ici.
// ════════════════════════════════════════════════════════════════════════

export type PageFieldType = 'text' | 'textarea' | 'url';

export interface PageField {
  key: string;
  label: string;
  type: PageFieldType;
  default: string;
  help?: string;
}

export interface PageSection {
  title: string;
  description?: string;
  fields: PageField[];
}

export interface PageTemplate {
  id: string;
  label: string;
  description: string;
  /** Page protégée (slug verrouillé, non supprimable). */
  system?: boolean;
  sections: PageSection[];
}

// ─── Modèle « Accueil » ───────────────────────────────────────────────────
// Reprend tous les textes de la page d'accueil qui ne sont PAS déjà pilotés
// par un module (sliders, produits, catégories). Voir src/app/page.tsx.
const ACCUEIL: PageTemplate = {
  id: 'accueil',
  label: 'Page d’accueil',
  description:
    'Textes de la page d’accueil non gérés par un autre module (héros, titres de sections, à-propos…).',
  system: true,
  sections: [
    {
      title: 'Section héros',
      description: 'Le grand bandeau en haut de la page d’accueil.',
      fields: [
        {
          key: 'heroTitle',
          label: 'Titre principal',
          type: 'textarea',
          default: 'Runes &\nMagie',
          help: 'Un retour à la ligne crée un saut de ligne dans le titre.',
        },
        { key: 'heroSubtitle', label: 'Sous-titre', type: 'text', default: 'Savoir Ancestral · Pouvoir Intérieur' },
        { key: 'heroDescription', label: 'Description', type: 'textarea', default: 'Cours, outils et guidance pour éveiller ta magie.' },
        { key: 'heroButton1Label', label: 'Bouton 1 — texte', type: 'text', default: 'Découvrir l’École & les Cours' },
        { key: 'heroButton1Href', label: 'Bouton 1 — lien', type: 'url', default: '/ecole' },
        { key: 'heroButton2Label', label: 'Bouton 2 — texte', type: 'text', default: 'Explorer la Boutique →' },
        { key: 'heroButton2Href', label: 'Bouton 2 — lien', type: 'url', default: '/boutique' },
      ],
    },
    {
      title: 'Section « Services »',
      description: 'Le titre au-dessus des carrousels de services (les services eux-mêmes se gèrent dans les Sliders).',
      fields: [
        { key: 'servicesTitle', label: 'Titre', type: 'text', default: 'Nos Services Mystiques' },
        { key: 'servicesSubtitle', label: 'Sous-titre', type: 'text', default: 'Guidance, soins et enseignements pour illuminer votre chemin' },
      ],
    },
    {
      title: 'Section « Produits »',
      description: 'Titre de la section produits vedettes (les produits se gèrent dans l’inventaire).',
      fields: [
        { key: 'productsTitle', label: 'Titre', type: 'text', default: 'Produits Enchantés' },
        { key: 'productsSubtitle', label: 'Sous-titre', type: 'text', default: 'Une sélection d’objets magiques choisis pour vous' },
        { key: 'productsButtonLabel', label: 'Bouton — texte', type: 'text', default: 'Voir toute la Boutique' },
      ],
    },
    {
      title: 'Section « Soins holistiques »',
      fields: [
        { key: 'soinsEyebrow', label: 'Sur-titre', type: 'text', default: 'ᚷ SOINS ÉNERGÉTIQUES EN LIGNE ᚷ' },
        { key: 'soinsTitle', label: 'Titre', type: 'text', default: 'Consultations Holistiques' },
        {
          key: 'soinsDescription',
          label: 'Description',
          type: 'textarea',
          default:
            'Connectez-vous avec des praticiens certifiés pour des soins énergétiques, du Reiki, de la naturopathie et bien plus — en ligne, depuis chez vous.',
        },
        { key: 'soinsCard1Label', label: 'Carte 1 — titre', type: 'text', default: 'Reiki' },
        { key: 'soinsCard1Desc', label: 'Carte 1 — description', type: 'text', default: 'Soin énergétique' },
        { key: 'soinsCard2Label', label: 'Carte 2 — titre', type: 'text', default: 'Naturopathie' },
        { key: 'soinsCard2Desc', label: 'Carte 2 — description', type: 'text', default: 'Santé naturelle' },
        { key: 'soinsCard3Label', label: 'Carte 3 — titre', type: 'text', default: 'Coaching Spirituel' },
        { key: 'soinsCard3Desc', label: 'Carte 3 — description', type: 'text', default: 'Éveil & transformation' },
        { key: 'soinsCard4Label', label: 'Carte 4 — titre', type: 'text', default: 'Cristallothérapie' },
        { key: 'soinsCard4Desc', label: 'Carte 4 — description', type: 'text', default: 'Soin par les pierres' },
        { key: 'soinsButtonLabel', label: 'Bouton — texte', type: 'text', default: 'Découvrir les Soins Holistiques →' },
        { key: 'soinsButtonHref', label: 'Bouton — lien', type: 'url', default: '/soins' },
      ],
    },
    {
      title: 'Section « À propos »',
      fields: [
        { key: 'aboutTitle', label: 'Titre', type: 'text', default: 'Votre Sorcière — Noctura Anna' },
        {
          key: 'aboutParagraph1',
          label: 'Paragraphe 1',
          type: 'textarea',
          default:
            'Praticienne des arts ancestraux, Noctura Anna canalise la sagesse des runes vikings, la magie des cristaux et les traditions de sorcellerie depuis plus de vingt ans. Son chemin spirituel l’a menée à créer Runes & Magie, un espace sacré dédié à l’éveil mystique et à la guérison de l’âme.',
        },
        {
          key: 'aboutParagraph2',
          label: 'Paragraphe 2',
          type: 'textarea',
          default:
            'À travers ses lectures intuitives, ses soins énergétiques et ses enseignements, elle guide chaque âme vers sa vérité intérieure avec bienveillance et puissance.',
        },
        { key: 'aboutButtonLabel', label: 'Bouton — texte', type: 'text', default: 'En savoir plus' },
        { key: 'aboutButtonHref', label: 'Bouton — lien', type: 'url', default: '/a-propos' },
      ],
    },
    {
      title: 'Section « Témoignages »',
      fields: [
        { key: 'testimonialsTitle', label: 'Titre', type: 'text', default: 'Paroles Enchantées' },
        { key: 'testimonialsSubtitle', label: 'Sous-titre', type: 'text', default: 'Ce que nos visiteurs murmurent à propos de leur expérience' },
      ],
    },
  ],
};

// ─── Modèle « Standard » ──────────────────────────────────────────────────
// Page de contenu générique : un titre, une intro et un corps de texte. Rendue
// publiquement via /[slug].
const STANDARD: PageTemplate = {
  id: 'standard',
  label: 'Page standard',
  description: 'Page de contenu simple : titre, introduction et corps de texte.',
  sections: [
    {
      title: 'Contenu de la page',
      fields: [
        { key: 'pageTitle', label: 'Titre de la page', type: 'text', default: '' },
        { key: 'pageSubtitle', label: 'Sous-titre / introduction', type: 'text', default: '' },
        {
          key: 'body',
          label: 'Corps du texte',
          type: 'textarea',
          default: '',
          help: 'Sépare les paragraphes par une ligne vide.',
        },
      ],
    },
  ],
};

export const PAGE_TEMPLATES: PageTemplate[] = [ACCUEIL, STANDARD];

export function getTemplate(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}

/** Tous les champs d'un modèle, à plat. */
export function templateFields(id: string): PageField[] {
  const t = getTemplate(id);
  if (!t) return [];
  return t.sections.flatMap((s) => s.fields);
}

/** Valeurs par défaut d'un modèle : { clé: default }. */
export function templateDefaults(id: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of templateFields(id)) out[f.key] = f.default;
  return out;
}
