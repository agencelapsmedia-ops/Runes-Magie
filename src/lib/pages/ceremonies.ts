import { FONTS, type FontKey } from '@/lib/service-landing';

/**
 * Contenu de la page « Cérémonies & Animations privées ».
 *
 * Les champs sont **plats et nommés un à un** plutôt que regroupés en tableaux.
 * C'est délibéré : l'édition se fait directement sur la page publique, et on
 * veut pouvoir cliquer sur *ce* titre-là pour changer *ce* titre-là. Un tableau
 * obligerait à ouvrir un éditeur de liste pour modifier un seul mot.
 *
 * Les valeurs ci-dessous sont celles de la maquette validée par la cliente.
 * Ce qui est stocké en base (`SitePage.content`) ne contient que les champs
 * qu'elle a personnalisés : tout le reste retombe ici. Vider un champ dans le
 * pupitre le ramène donc à son texte d'origine.
 */
const DEFAUTS = {
  // ── Hero ──────────────────────────────────────────────────────────────
  heroTitre: 'Cérémonies & Animations privées',
  heroAccroche:
    'Des expériences uniques, symboliques et personnalisées pour célébrer, rassembler et créer des souvenirs mémorables.',
  heroImage: '',
  heroImageAlt: 'Noctura célébrant une cérémonie en plein air, entourée de participantes',
  heroCta1Label: 'Découvrir nos services',
  heroCta1Href: '#nos-ceremonies',
  heroCta2Label: 'Nous contacter',
  heroCta2Href: '/contact',

  // ── Célébrez autrement ────────────────────────────────────────────────
  introTitre: 'Célébrez autrement',
  introTexte:
    'Chaque moment important mérite une expérience qui lui ressemble.\n\n' +
    'Runes & Magie crée des cérémonies et des animations personnalisées mêlant symbolisme, magie naturelle, intention et connexion humaine.\n\n' +
    "Que ce soit pour une union, une naissance, une fête familiale, un rassemblement entre amis ou une activité de groupe, chaque expérience est adaptée à vos intentions.",
  introImage: '',
  introImageAlt: 'Autel de cérémonie garni de bougies, de fleurs et de cristaux',

  // ── Nos cérémonies (4 cartes) ─────────────────────────────────────────
  ceremoniesTitre: 'Nos cérémonies',

  ceremonie1Titre: 'Mariages & unions',
  ceremonie1Texte:
    'Une cérémonie symbolique créée autour de votre histoire, de vos valeurs et de votre union.',
  ceremonie1Icone: 'anneaux',
  ceremonie1Image: '',

  ceremonie2Titre: 'Baptêmes & naissances',
  ceremonie2Texte:
    'Accueillez une nouvelle âme avec une cérémonie douce et personnalisée entourée de vos proches.',
  ceremonie2Icone: 'naissance',
  ceremonie2Image: '',

  ceremonie3Titre: 'Cérémonies personnalisées',
  ceremonie3Texte:
    'Anniversaire, passage important, renouvellement, hommage ou autre moment significatif.',
  ceremonie3Icone: 'flamme',
  ceremonie3Image: '',

  ceremonie4Titre: 'Rituels privés de groupe',
  ceremonie4Texte:
    'Une expérience créée spécialement pour votre famille, vos amis ou votre groupe.',
  ceremonie4Icone: 'groupe',
  ceremonie4Image: '',

  // ── Animations privées ────────────────────────────────────────────────
  animationsTitre: 'Animations privées',
  animationsAccroche: 'Une expérience magique pour votre groupe',
  animationsOccasions:
    'Anniversaire · Fête familiale · Soirée entre amis\n' +
    'Enterrement de vie de jeune fille ou de garçon\n' +
    'Rassemblement privé · Activité spéciale',
  animationsFormule1: 'Initiation aux runes',
  animationsFormule1Icone: 'rune',
  animationsFormule2: 'Tirage de cartes en groupe',
  animationsFormule2Icone: 'cartes',
  animationsFormule3: 'Ateliers de magie naturelle',
  animationsFormule3Icone: 'mortier',
  animationsFormule4: 'Rituels personnalisés',
  animationsFormule4Icone: 'lotus',
  animationsCtaLabel: 'Créer mon expérience',
  animationsCtaHref: '/contact',
  animationsImage: '',
  animationsImageAlt: 'Groupe réuni autour de bougies pour une animation privée',

  // ── Une expérience créée sur mesure (4 étapes) ────────────────────────
  etapesTitre: 'Une expérience créée sur mesure',

  etape1Titre: 'Votre intention',
  etape1Texte: "Nous écoutons vos besoins, vos envies et l'énergie que vous souhaitez créer.",
  etape1Icone: 'boule',

  etape2Titre: "Création de l'expérience",
  etape2Texte:
    "Nous imaginons et préparons une cérémonie ou animation unique, adaptée à votre groupe et à l'occasion.",
  etape2Icone: 'grimoire',

  etape3Titre: 'Cérémonie ou animation',
  etape3Texte:
    'Nous célébrons ensemble à travers un rituel ou une activité significative et authentique.',
  etape3Icone: 'mains',

  etape4Titre: 'Un moment mémorable',
  etape4Texte: 'Vous repartez avec des souvenirs précieux et une énergie renouvelée.',
  etape4Icone: 'groupe',

  // ── Entreprises et organisations ──────────────────────────────────────
  corpoTitre: 'Pour les entreprises et organisations',
  corpoTexte:
    'Vous organisez une activité corporative ?\n\n' +
    'Découvrez nos expériences de groupe conçues pour les entreprises, équipes et organisations.',
  corpoImage: '',
  corpoImageAlt: 'Animation corporative dans une salle éclairée à la bougie',
  corpoAtout1: 'Cohésion',
  corpoAtout1Icone: 'mains',
  corpoAtout2: 'Connexion',
  corpoAtout2Icone: 'flamme',
  corpoAtout3: 'Découverte',
  corpoAtout3Icone: 'boule',
  corpoAtout4: 'Expérience immersive',
  corpoAtout4Icone: 'groupe',
  corpoCtaLabel: 'Découvrir les animations corporatives',
  corpoCtaHref: '/contact',

  // ── Galerie ───────────────────────────────────────────────────────────
  galerieTitre: 'Des instants magiques',
  galerie1: '',
  galerie2: '',
  galerie3: '',
  galerie4: '',
  galerie5: '',

  // ── Appel final ───────────────────────────────────────────────────────
  finalTitre: 'Créons votre cérémonie',
  finalTexte:
    "Vous avez une idée, une occasion à célébrer ou simplement l'envie de créer quelque chose de différent ? Parlez-nous de votre projet.",
  finalCtaLabel: 'Demander une cérémonie ou une animation',
  finalCtaHref: '/contact',
  signature: 'L’amour avant toute chose.',

  // ── Polices (pilotables depuis le pupitre) ────────────────────────────
  titleFont: 'cinzel-decorative',
  labelFont: 'cinzel',
  bodyFont: 'cormorant',
};

export type ContenuCeremonies = typeof DEFAUTS;

/** Noms de tous les champs éditables — sert à la validation côté serveur. */
export const CHAMPS_CEREMONIES = Object.keys(DEFAUTS) as ReadonlyArray<keyof ContenuCeremonies>;

/** Champs qui désignent une police : leur valeur doit exister dans FONTS. */
const CHAMPS_POLICE = ['titleFont', 'labelFont', 'bodyFont'] as const;

export const CEREMONIES_DEFAUT: ContenuCeremonies = DEFAUTS;

/**
 * Reconstruit un contenu complet à partir du JSON stocké en base, quel que soit
 * son état. On ne fait jamais confiance à ce qui vient de la base : un champ
 * absent, vide, ou d'un type inattendu retombe sur sa valeur par défaut.
 */
export function parseCeremonies(json: unknown): ContenuCeremonies {
  const source =
    json && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};

  const sortie: ContenuCeremonies = { ...DEFAUTS };

  for (const cle of CHAMPS_CEREMONIES) {
    const valeur = source[cle];
    if (typeof valeur !== 'string') continue;

    if ((CHAMPS_POLICE as readonly string[]).includes(cle)) {
      // Une police inconnue casserait le rendu : on garde celle par défaut.
      if (valeur in FONTS) sortie[cle] = valeur as FontKey;
      continue;
    }

    // Une chaîne vide n'est pas une personnalisation : c'est un retour au défaut.
    if (valeur.trim()) sortie[cle] = valeur;
  }

  return sortie;
}
