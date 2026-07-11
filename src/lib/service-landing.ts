import type { Metadata } from 'next';
import type { OfferingView } from '@/lib/offerings';
import { SITE_URL, BOUTIQUE_NAME } from '@/lib/constants';

export interface ServiceLandingContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  sanctuaryTitle: string;
  sanctuaryText: string;
  recognitionTitle: string;
  recognitionIntro: string;
  recognitionItems: string[];
  recognitionFinalText: string;
  recognitionPortalText: string;
  pillarsTitle: string;
  processTitle: string;
  faqTitle: string;
  finalTitle: string;
  finalText: string;
  ctaLabel: string;
  heroImage: string | null;
  mobileImage: string | null;
  imageAlt: string;
  faqImageAlt: string;
  // Hero immersif (fond + personnage). Null = ancien hero en dégradé.
  backgroundUrl: string | null;
  characterUrl: string | null;
  faqImageUrl: string | null;
  pillarRunes: string[];
  /** Icônes images (URL) affichées devant chaque pilier, alignées sur `features`. Prioritaires sur `pillarRunes`. */
  pillarIcons: string[];
  /** Liste de la section « bienfaits » (cartes numérotées), indépendante de `features`. */
  benefits: string[];
  steps: Array<{ number: string; title: string; text: string }>;
  faqs: Array<{ question: string; answer: string }>;
  // --- SEO (pilotable depuis le panneau « SEO ») ---
  /** Meta-titre personnalisé. Vide → titre auto « {nom} avec {praticien} | … ». */
  metaTitle: string;
  /** Meta-description personnalisée. Vide → extrait de l'intro. */
  metaDescription: string;
  /** Mot-clé cible pour l'analyse SEO (non rendu sur la page). */
  focusKeyword: string;
  /** Image de partage réseaux sociaux (Open Graph). Vide → image héro. */
  ogImage: string;
  /** Police des grands titres (H1 + titres de sections). */
  titleFont: FontKey;
  /** Police des sous-titres et labels. */
  labelFont: FontKey;
  /** Police des paragraphes. */
  bodyFont: FontKey;
  // Polices par titre (héritent de `titleFont` si non personnalisées).
  heroTitleFont: FontKey;
  sanctuaryTitleFont: FontKey;
  recognitionTitleFont: FontKey;
  pillarsTitleFont: FontKey;
  processTitleFont: FontKey;
  faqTitleFont: FontKey;
  finalTitleFont: FontKey;
}

/** Polices disponibles dans le projet (chargées dans layout.tsx). */
export const FONTS = {
  'cinzel-decorative': { label: 'Cinzel Decorative', css: "'Cinzel Decorative', serif" },
  cinzel: { label: 'Cinzel', css: "'Cinzel', serif" },
  cormorant: { label: 'Cormorant Garamond', css: "'Cormorant Garamond', serif" },
  philosopher: { label: 'Philosopher', css: "'Philosopher', sans-serif" },
  medieval: { label: 'MedievalSharp', css: "'MedievalSharp', cursive" },
} as const;

export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

/** Les 3 réglages de police surchargeables (catégories de texte). */
export const FONT_FIELDS = ['titleFont', 'labelFont', 'bodyFont'] as const;
export type FontField = (typeof FONT_FIELDS)[number];

/** Polices par titre individuel (héritent de `titleFont` si laissées « par défaut »). */
export const TITLE_FONT_FIELDS = [
  'heroTitleFont',
  'sanctuaryTitleFont',
  'recognitionTitleFont',
  'pillarsTitleFont',
  'processTitleFont',
  'faqTitleFont',
  'finalTitleFont',
] as const;
export type TitleFontField = (typeof TITLE_FONT_FIELDS)[number];

/** Libellés lisibles des polices par titre (réutilisés dans le panneau admin). */
export const TITLE_FONT_LABELS: Record<TitleFontField, string> = {
  heroTitleFont: 'Titre principal (hero)',
  sanctuaryTitleFont: 'Titre du sanctuaire',
  recognitionTitleFont: 'Titre de la section reconnaissance',
  pillarsTitleFont: 'Titre des bienfaits',
  processTitleFont: 'Titre des étapes',
  faqTitleFont: 'Titre de la FAQ',
  finalTitleFont: "Titre de l'appel final",
};

/** Police par défaut de chaque catégorie (rendu identique à l'actuel). */
export const DEFAULT_FONTS: Record<FontField, FontKey> = {
  titleFont: 'cinzel-decorative',
  labelFont: 'cinzel',
  bodyFont: 'cormorant',
};

function isFontKey(value: unknown): value is FontKey {
  return typeof value === 'string' && value in FONTS;
}

/** Runes vikings dorées utilisées par défaut devant les piliers (cycle). */
export const DEFAULT_PILLAR_RUNES = ['ᚱ', 'ᚨ', 'ᛟ', 'ᚦ', 'ᛜ', 'ᛉ', 'ᚹ', 'ᛊ', 'ᚲ', 'ᛇ'];

/** Icônes-symboles dorées par défaut du Soin Rituel (une par pilier, dans l'ordre des `features`). */
export const SOIN_RITUEL_PILLAR_ICONS = [
  '/images/services/arcane/icons/1.webp',
  '/images/services/arcane/icons/2.webp',
  '/images/services/arcane/icons/3.webp',
  '/images/services/arcane/icons/4.webp',
  '/images/services/arcane/icons/5.webp',
  '/images/services/arcane/icons/6.webp',
  '/images/services/arcane/icons/7.webp',
];

/**
 * Textes personnalisables depuis l'admin, stockés dans `Offering.landingContent`
 * et fusionnés par-dessus les valeurs par défaut générées. Tous optionnels :
 * un champ absent garde le texte par défaut.
 */
export interface ServiceLandingOverrides {
  eyebrow?: string;
  subtitle?: string;
  intro?: string;
  sanctuaryTitle?: string;
  sanctuaryText?: string;
  recognitionTitle?: string;
  recognitionIntro?: string;
  recognitionItems?: string[];
  recognitionFinalText?: string;
  recognitionPortalText?: string;
  pillarsTitle?: string;
  processTitle?: string;
  faqTitle?: string;
  finalTitle?: string;
  finalText?: string;
  ctaLabel?: string;
  imageAlt?: string;
  faqImageAlt?: string;
  backgroundUrl?: string;
  characterUrl?: string;
  faqImageUrl?: string;
  pillarRunes?: string[];
  pillarIcons?: string[];
  benefits?: string[];
  steps?: Array<{ number: string; title: string; text: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  ogImage?: string;
  titleFont?: FontKey;
  labelFont?: FontKey;
  bodyFont?: FontKey;
  heroTitleFont?: FontKey;
  sanctuaryTitleFont?: FontKey;
  recognitionTitleFont?: FontKey;
  pillarsTitleFont?: FontKey;
  processTitleFont?: FontKey;
  faqTitleFont?: FontKey;
  finalTitleFont?: FontKey;
}

/** Champs texte simples surchargeables (un par bouton ✦). */
export const LANDING_TEXT_FIELDS = [
  'eyebrow',
  'subtitle',
  'intro',
  'sanctuaryTitle',
  'sanctuaryText',
  'recognitionTitle',
  'recognitionIntro',
  'recognitionFinalText',
  'recognitionPortalText',
  'pillarsTitle',
  'processTitle',
  'faqTitle',
  'finalTitle',
  'finalText',
  'ctaLabel',
  'imageAlt',
  'faqImageAlt',
  'backgroundUrl',
  'characterUrl',
  'faqImageUrl',
  'metaTitle',
  'metaDescription',
  'focusKeyword',
  'ogImage',
] as const;

/** Champs listes structurées surchargeables. */
export const LANDING_LIST_FIELDS = ['steps', 'faqs', 'pillarRunes', 'pillarIcons', 'benefits', 'recognitionItems'] as const;

export type LandingTextField = (typeof LANDING_TEXT_FIELDS)[number];

/** Valide et nettoie un objet `landingContent` brut venu de la base. */
export function parseLandingOverrides(raw: unknown): ServiceLandingOverrides {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  const out: ServiceLandingOverrides = {};

  for (const field of LANDING_TEXT_FIELDS) {
    const value = source[field];
    if (typeof value === 'string' && value.trim()) out[field] = value;
  }

  if (Array.isArray(source.steps)) {
    const steps = source.steps
      .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
      .map((s, i) => ({
        number: String(i + 1).padStart(2, '0'),
        title: String(s.title ?? '').trim(),
        text: String(s.text ?? '').trim(),
      }))
      .filter((s) => s.title || s.text);
    if (steps.length) out.steps = steps;
  }

  if (Array.isArray(source.pillarRunes)) {
    const runes = source.pillarRunes.map((r) => String(r ?? '').trim()).filter(Boolean);
    if (runes.length) out.pillarRunes = runes;
  }

  if (Array.isArray(source.pillarIcons)) {
    // On conserve les chaînes vides pour garder l'alignement icône ↔ pilier,
    // mais on n'enregistre l'override que si au moins une icône est définie.
    const icons = source.pillarIcons.map((i) => String(i ?? '').trim());
    if (icons.some(Boolean)) out.pillarIcons = icons;
  }

  if (Array.isArray(source.benefits)) {
    const benefits = source.benefits.map((b) => String(b ?? '').trim()).filter(Boolean);
    if (benefits.length) out.benefits = benefits;
  }

  if (Array.isArray(source.recognitionItems)) {
    const recognitionItems = source.recognitionItems.map((b) => String(b ?? '').trim()).filter(Boolean);
    if (recognitionItems.length) out.recognitionItems = recognitionItems;
  }

  if (Array.isArray(source.faqs)) {
    const faqs = source.faqs
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map((f) => ({
        question: String(f.question ?? '').trim(),
        answer: String(f.answer ?? '').trim(),
      }))
      .filter((f) => f.question || f.answer);
    if (faqs.length) out.faqs = faqs;
  }

  for (const field of FONT_FIELDS) {
    if (isFontKey(source[field])) out[field] = source[field] as FontKey;
  }
  for (const field of TITLE_FONT_FIELDS) {
    if (isFontKey(source[field])) out[field] = source[field] as FontKey;
  }

  return out;
}

/** Applique les textes personnalisés par-dessus le contenu par défaut. */
function applyOverrides(
  base: ServiceLandingContent,
  overrides: ServiceLandingOverrides,
): ServiceLandingContent {
  return {
    ...base,
    eyebrow: overrides.eyebrow ?? base.eyebrow,
    subtitle: overrides.subtitle ?? base.subtitle,
    intro: overrides.intro ?? base.intro,
    sanctuaryTitle: overrides.sanctuaryTitle ?? base.sanctuaryTitle,
    sanctuaryText: overrides.sanctuaryText ?? base.sanctuaryText,
    recognitionTitle: overrides.recognitionTitle ?? base.recognitionTitle,
    recognitionIntro: overrides.recognitionIntro ?? base.recognitionIntro,
    recognitionItems: overrides.recognitionItems?.length ? overrides.recognitionItems : base.recognitionItems,
    recognitionFinalText: overrides.recognitionFinalText ?? base.recognitionFinalText,
    recognitionPortalText: overrides.recognitionPortalText ?? base.recognitionPortalText,
    pillarsTitle: overrides.pillarsTitle ?? base.pillarsTitle,
    processTitle: overrides.processTitle ?? base.processTitle,
    faqTitle: overrides.faqTitle ?? base.faqTitle,
    finalTitle: overrides.finalTitle ?? base.finalTitle,
    finalText: overrides.finalText ?? base.finalText,
    ctaLabel: overrides.ctaLabel ?? base.ctaLabel,
    imageAlt: overrides.imageAlt ?? base.imageAlt,
    faqImageAlt: overrides.faqImageAlt ?? base.faqImageAlt,
    backgroundUrl: overrides.backgroundUrl ?? base.backgroundUrl,
    characterUrl: overrides.characterUrl ?? base.characterUrl,
    faqImageUrl: overrides.faqImageUrl ?? base.faqImageUrl,
    pillarRunes: overrides.pillarRunes?.length ? overrides.pillarRunes : base.pillarRunes,
    pillarIcons: overrides.pillarIcons?.length ? overrides.pillarIcons : base.pillarIcons,
    benefits: overrides.benefits?.length ? overrides.benefits : base.benefits,
    steps: overrides.steps?.length ? overrides.steps : base.steps,
    faqs: overrides.faqs?.length ? overrides.faqs : base.faqs,
    metaTitle: overrides.metaTitle ?? base.metaTitle,
    metaDescription: overrides.metaDescription ?? base.metaDescription,
    focusKeyword: overrides.focusKeyword ?? base.focusKeyword,
    ogImage: overrides.ogImage ?? base.ogImage,
    titleFont: overrides.titleFont ?? base.titleFont,
    labelFont: overrides.labelFont ?? base.labelFont,
    bodyFont: overrides.bodyFont ?? base.bodyFont,
    // Polices par titre : override individuel, sinon on suit la police globale des titres.
    heroTitleFont: overrides.heroTitleFont ?? overrides.titleFont ?? base.titleFont,
    sanctuaryTitleFont: overrides.sanctuaryTitleFont ?? overrides.titleFont ?? base.titleFont,
    recognitionTitleFont: overrides.recognitionTitleFont ?? overrides.titleFont ?? base.titleFont,
    pillarsTitleFont: overrides.pillarsTitleFont ?? overrides.titleFont ?? base.titleFont,
    processTitleFont: overrides.processTitleFont ?? overrides.titleFont ?? base.titleFont,
    faqTitleFont: overrides.faqTitleFont ?? overrides.titleFont ?? base.titleFont,
    finalTitleFont: overrides.finalTitleFont ?? overrides.titleFont ?? base.titleFont,
  };
}

const SOIN_RITUEL_STEPS: ServiceLandingContent['steps'] = [
  {
    number: '01',
    title: 'Accueil du seuil',
    text: "Noctura t'accueille dans un espace calme, protégé, sans jugement. Tu peux nommer ce qui pèse ou simplement arriver avec ton silence.",
  },
  {
    number: '02',
    title: 'Lecture de ce qui pèse',
    text: "Le rituel s'ouvre par l'écoute de ton énergie, de ton souffle, de tes tensions et de ce que l'invisible révèle.",
  },
  {
    number: '03',
    title: 'Transmutation',
    text: "Les outils sacrés, les chants, les éléments et la présence de Noctura accompagnent la dissolution des charges qui ne t'appartiennent plus.",
  },
  {
    number: '04',
    title: 'Retour au souffle',
    text: "Le soin se referme doucement pour que ton corps, ton coeur et ton âme puissent intégrer l'apaisement.",
  },
];

function buildGenericSteps(offering: OfferingView): ServiceLandingContent['steps'] {
  return [
    {
      number: '01',
      title: 'Accueil',
      text: `${offering.practitionerName} t'accueille dans un espace calme et bienveillant, à ton rythme.`,
    },
    {
      number: '02',
      title: 'Écoute',
      text: 'La rencontre commence par un temps d’écoute de ce que tu portes et de ton intention.',
    },
    {
      number: '03',
      title: 'Le service',
      text: offering.description,
    },
    {
      number: '04',
      title: 'Intégration',
      text: 'Un temps de retour au calme pour que ce qui a été vécu puisse s’ancrer doucement.',
    },
  ];
}

export function buildServiceLandingContent(offering: OfferingView): ServiceLandingContent {
  const base = buildDefaultLandingContent(offering);
  const content = applyOverrides(base, offering.landing ?? {});
  return offering.slug === 'soin-rituel' ? sanitizeSoinRituelMetaCopy(content) : content;
}

/**
 * Garde les personnalisations visuelles et les textes déjà acceptables, mais
 * neutralise les formulations du Soin Rituel qui pourraient être comprises
 * comme un diagnostic personnel, une promesse médicale ou un résultat garanti.
 */
function sanitizeSoinRituelMetaCopy(content: ServiceLandingContent): ServiceLandingContent {
  const replacements = new Map<string, string>([
    ['DÉPARASITAGE', 'RECENTRAGE'],
    ['DÉBLOCAGE ÉMOTIONNEL', 'EXPLORATION INTÉRIEURE'],
    ['PURIFICATION', 'RENOUVELLEMENT SYMBOLIQUE'],
    ['BANNISSEMENT', 'LÂCHER-PRISE'],
    ['COUPURE DE LIEN TOXIQUE', 'PRISE DE RECUL'],
    ['Tu dors mais tu ne récupères pas.', "S'accorder une pause dans un espace calme."],
    ['Tu vis des émotions qui ne sont pas les tiennes.', 'Explorer ses ressentis dans un cadre symbolique.'],
    ['Tu absorbes facilement le fardeau des autres.', 'Prendre du recul sur ce qui occupe ses pensées.'],
    ['Tu te poses sans cesse la question si tu peux faire mieux.', 'Nourrir une réflexion personnelle à son rythme.'],
    ['Tu ressens un poids immense sur tes épaules en permanence.', "S'offrir un moment de recentrage."],
    ['Tu es souvent malade sans aucune raison.', 'Vivre une expérience spirituelle personnalisée.'],
    ['Tu te sens comme si un brouillard voilait ton esprit et ta vision.', 'Explorer une intention ou une période de transition.'],
    ['Tu te sens au ralenti et déconcentré en général.', 'Prendre un moment pour ralentir et revenir à soi.'],
    ['Tu cherches encore des réponses après avoir vu un médecin et/ou des spécialistes.', 'Découvrir les runes et les cartes comme outils de réflexion.'],
    ['DÉTENTE TOTALE', 'MOMENT DE DÉTENTE'],
    ['RELATIONS AMÉLIORÉES', 'RÉFLEXION SUR SES RELATIONS'],
    ['COMPRÉHENSION DES BLOCAGES', 'EXPLORATION DE SES REPÈRES'],
    ['PURGE DE VIEUX SCHÉMAS', 'PRISE DE RECUL SUR SES HABITUDES'],
    ['VIE PLUS SAINE', 'MOMENT CONSACRÉ À SOI'],
    ['ESTIME & CONFIANCE EN SOI', 'CONNEXION À SES RESSOURCES'],
    ['ESPRIT PLUS CLAIR', 'ESPACE DE RÉFLEXION'],
  ]);

  const replaceExact = (value: string) => replacements.get(value) ?? value;
  const safeFaqs = content.faqs.map((faq) => {
    if (/combien de temps durent les bienfaits/i.test(faq.question)) {
      return {
        question: 'Combien de temps peut-on ressentir les effets de l’expérience?',
        answer:
          "Chaque personne vit l’expérience différemment. Certains ressentent surtout une détente immédiate, tandis que d’autres continuent à réfléchir aux symboles et aux intentions explorés. Aucun résultat précis ni aucune durée ne peuvent être garantis.",
      };
    }
    return { question: replaceExact(faq.question), answer: replaceExact(faq.answer) };
  });

  if (!safeFaqs.some((faq) => /professionnel de la santé/i.test(faq.answer))) {
    safeFaqs.push({
      question: 'Est-ce un traitement médical ou psychologique?',
      answer:
        "Non. Le Soin Rituel est une expérience spirituelle de détente et d’exploration personnelle. Il ne remplace pas les conseils, le diagnostic ou les soins d’un professionnel de la santé.",
    });
  }

  return {
    ...content,
    subtitle:
      content.subtitle === 'LIBÉRATION, SÉRÉNITÉ, TRANSFORMATION'
        ? 'RECENTRAGE, SÉRÉNITÉ, EXPLORATION'
        : content.subtitle,
    intro: /changement véritable à long terme/i.test(content.intro)
      ? 'Un soin en profondeur précédé par un rituel inspiré de pratiques spirituelles anciennes. Une expérience de détente riche en sensations, consacrée à l’exploration personnelle. Les ressentis peuvent varier d’une personne à l’autre.'
      : content.intro,
    recognitionTitle: /est-ce que tu te reconnais/i.test(content.recognitionTitle)
      ? 'UN MOMENT POUR SOI'
      : content.recognitionTitle,
    recognitionIntro: /hypersensible|empathique|éponge|sauveur/i.test(content.recognitionIntro)
      ? 'Cette expérience peut accompagner une intention de détente, de réflexion ou de recentrage.'
      : content.recognitionIntro,
    recognitionItems: content.recognitionItems.map(replaceExact),
    recognitionFinalText: /ce soin (est conçu|a été créé) pour toi/i.test(content.recognitionFinalText)
      ? 'Aucune expérience préalable avec les pratiques spirituelles n’est nécessaire. Il suffit d’arriver avec curiosité et ouverture.'
      : content.recognitionFinalText,
    recognitionPortalText: /retrouve|paix intérieure durable/i.test(content.recognitionPortalText)
      ? 'Accorde-toi un moment pour ralentir, explorer une intention et te reconnecter à tes repères intérieurs.'
      : content.recognitionPortalText,
    sanctuaryTitle: /lieu de guérison/i.test(content.sanctuaryTitle)
      ? 'NOTRE TEMPLE EST UN ESPACE DE RECENTRAGE…'
      : content.sanctuaryTitle,
    pillarsTitle: /bienfaits du soin rituel|bienfaits que le rituel procure/i.test(content.pillarsTitle)
      ? 'LES INTENTIONS DE L’EXPÉRIENCE'
      : content.pillarsTitle,
    benefits: content.benefits.map(replaceExact),
    finalTitle: /ce qui te pèse n'a pas à rester en toi/i.test(content.finalTitle)
      ? 'UN MOMENT POUR RALENTIR ET TE RECENTRER'
      : content.finalTitle,
    finalText: /ton mal est reconnu|dissoudre l'ombre|perdent leur emprise/i.test(content.finalText)
      ? 'Dans l’ambiance feutrée du Temple, accorde-toi un moment consacré à l’écoute, au symbolisme et à l’exploration personnelle. Chaque expérience est unique et les ressentis peuvent varier.'
      : content.finalText,
    faqs: safeFaqs,
  };
}

function buildDefaultLandingContent(offering: OfferingView): ServiceLandingContent {
  const isSoinRituel = offering.slug === 'soin-rituel';
  const soinRituelDefaultImage = '/images/services/arcane/noctura-caracal.png';
  const serviceImage =
    isSoinRituel && (!offering.imageUrl || offering.imageUrl === '/images/services/soin-rituel.svg')
      ? soinRituelDefaultImage
      : offering.imageUrl;

  if (isSoinRituel) {
    return {
      eyebrow: 'La Voie des Arcanes présente',
      title: offering.name,
      subtitle: 'Une expérience de recentrage guidée par Noctura, prêtresse de La Voie des Arcanes',
      intro:
        "Tu franchis le seuil pour t'accorder une pause. Noctura t'accueille dans une expérience spirituelle consacrée à la détente, au symbolisme et à l'exploration personnelle.",
      sanctuaryTitle: 'Un seuil où rien en toi ne sera jugé',
      sanctuaryText:
        "Entre les mains de Noctura, les fardeaux ne sont pas jugés: ils sont entendus. Le rituel devient alors un seuil où l'âme se déleste, se réaccorde et retrouve son souffle.",
      recognitionTitle: 'Un moment pour soi',
      recognitionIntro: 'Cette expérience peut accompagner une intention de détente, de réflexion ou de recentrage.',
      recognitionItems: [
        "S'accorder une pause dans un espace calme.",
        'Explorer une intention personnelle.',
        'Découvrir les runes et les cartes comme outils de réflexion.',
        'Vivre une expérience spirituelle personnalisée.',
        'Prendre du recul sur son parcours.',
        'Prendre un moment pour ralentir et revenir à soi.',
      ],
      recognitionFinalText: "Aucune expérience préalable avec les pratiques spirituelles n'est nécessaire. Il suffit d'arriver avec curiosité et ouverture.",
      recognitionPortalText: "Accorde-toi un moment pour ralentir, explorer une intention et te reconnecter à tes repères intérieurs.",
      pillarsTitle: "Les intentions de l'expérience",
      processTitle: 'Le passage du soin',
      faqTitle: 'Questions avant de franchir le seuil',
      finalTitle: 'Un moment pour ralentir et te recentrer',
      finalText:
        "Dans l'ambiance feutrée du Temple, accorde-toi un moment consacré à l'écoute, au symbolisme et à l'exploration personnelle. Chaque expérience est unique et les ressentis peuvent varier.",
      ctaLabel: 'Réserver le soin',
      heroImage: serviceImage,
      mobileImage: serviceImage,
      imageAlt: 'Noctura, prêtresse de La Voie des Arcanes, guidant le Soin Rituel',
      faqImageAlt: 'Questions fréquentes sur le Soin Rituel',
      backgroundUrl: '/images/services/arcane/soin-rituel-fond.jpg',
      characterUrl: '/images/services/arcane/soin-rituel-personnage.webp',
      faqImageUrl: '/images/services/arcane/soin-rituel-faq.jpg',
      pillarRunes: DEFAULT_PILLAR_RUNES,
      pillarIcons: SOIN_RITUEL_PILLAR_ICONS,
      benefits: [...offering.features],
      steps: SOIN_RITUEL_STEPS,
      faqs: [
        {
          question: 'Quels sont les effets du Soin Rituel?',
          answer:
            "Tu peux ressentir un apaisement profond, une impression d'allègement, une clarté nouvelle ou une libération de tensions anciennes.",
        },
        {
          question: 'Est-ce que je dois me préparer?',
          answer:
            "Arrive simplement avec ton intention. Si tu le souhaites, tu peux prendre un moment de silence avant la rencontre et nommer intérieurement ce que tu es prêt à déposer.",
        },
        {
          question: 'Est-ce que chaque soin est pareil?',
          answer:
            "Non. Noctura adapte l'expérience à ton intention et au déroulement de la rencontre.",
        },
        {
          question: 'Est-ce un traitement médical ou psychologique?',
          answer:
            "Non. Le Soin Rituel est une expérience spirituelle de détente et d'exploration personnelle. Il ne remplace pas les conseils, le diagnostic ou les soins d'un professionnel de la santé.",
        },
      ],
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      ogImage: '',
      titleFont: DEFAULT_FONTS.titleFont,
      labelFont: DEFAULT_FONTS.labelFont,
      bodyFont: DEFAULT_FONTS.bodyFont,
      heroTitleFont: DEFAULT_FONTS.titleFont,
      sanctuaryTitleFont: DEFAULT_FONTS.titleFont,
      recognitionTitleFont: DEFAULT_FONTS.titleFont,
      pillarsTitleFont: DEFAULT_FONTS.titleFont,
      processTitleFont: DEFAULT_FONTS.titleFont,
      faqTitleFont: DEFAULT_FONTS.titleFont,
      finalTitleFont: DEFAULT_FONTS.titleFont,
    };
  }

  return {
    eyebrow: 'La Voie des Arcanes présente',
    title: offering.name,
    subtitle: `Une expérience sacrée guidée par ${offering.practitionerName}`,
    intro: offering.description,
    sanctuaryTitle: 'Un espace pour déposer ce qui demande à être vu',
    sanctuaryText: offering.longDescription,
    recognitionTitle: 'Est-ce que tu te reconnais ?',
    recognitionIntro: 'Peut-être portes-tu plus que tu ne devrais porter...',
    recognitionItems: [...offering.features],
    recognitionFinalText: "Si tu t'es reconnu dans l'un de ces points, ce service a été créé pour toi.",
    recognitionPortalText: 'Ici, tu peux déposer ce qui pèse et retrouver plus de clarté.',
    pillarsTitle: 'Ce que comprend ce service',
    processTitle: "Le déroulement de l'expérience",
    faqTitle: 'Questions fréquentes',
    finalTitle: 'Quand le seuil appelle, il est temps de répondre',
    finalText: "Réserve ton moment et entre dans une expérience conçue pour t'accompagner avec présence, respect et puissance.",
    ctaLabel: 'Réserver le soin',
    heroImage: serviceImage,
    mobileImage: serviceImage,
    imageAlt: `${offering.name} avec ${offering.practitionerName}`,
    faqImageAlt: `Questions fréquentes sur ${offering.name}`,
    backgroundUrl: null,
    characterUrl: null,
    faqImageUrl: null,
    pillarRunes: DEFAULT_PILLAR_RUNES,
    pillarIcons: [],
    benefits: [...offering.features],
    steps: buildGenericSteps(offering),
    faqs: [
      {
        question: 'Comment se déroule ce service?',
        answer: offering.longDescription || offering.description,
      },
      {
        question: 'Combien de temps faut-il prévoir?',
        answer: `Prévois environ ${offering.durationLabel}.`,
      },
    ],
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    ogImage: '',
    titleFont: DEFAULT_FONTS.titleFont,
    labelFont: DEFAULT_FONTS.labelFont,
    bodyFont: DEFAULT_FONTS.bodyFont,
    heroTitleFont: DEFAULT_FONTS.titleFont,
    sanctuaryTitleFont: DEFAULT_FONTS.titleFont,
    recognitionTitleFont: DEFAULT_FONTS.titleFont,
    pillarsTitleFont: DEFAULT_FONTS.titleFont,
    processTitleFont: DEFAULT_FONTS.titleFont,
    faqTitleFont: DEFAULT_FONTS.titleFont,
    finalTitleFont: DEFAULT_FONTS.titleFont,
  };
}

/** Rend une URL absolue (préfixe SITE_URL si chemin relatif). */
function toAbsoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

export function buildServiceLandingMetadata(offering: OfferingView): Metadata {
  const content = buildServiceLandingContent(offering);
  // Meta-titre : valeur personnalisée (panneau SEO) sinon titre auto.
  const autoTitle = `${offering.name} avec ${offering.practitionerName} | La Voie des Arcanes`;
  const title = content.metaTitle.trim() || autoTitle;
  // Meta-description : valeur personnalisée sinon extrait de l'intro, aplati sur une
  // seule ligne (l'intro peut désormais contenir des sauts de ligne / paragraphes).
  const introOneLine = content.intro.replace(/\s+/g, ' ').trim();
  const autoDescription =
    introOneLine.length > 155 ? `${introOneLine.slice(0, 152)}...` : introOneLine;
  const description = content.metaDescription.trim() || autoDescription;
  const url = `${SITE_URL}${offering.detailHref}`;
  // Image sociale : ogImage personnalisée sinon image héro.
  const imageUrl = toAbsoluteUrl(content.ogImage.trim() || content.heroImage);
  const images = imageUrl ? [{ url: imageUrl, alt: content.imageAlt }] : undefined;
  const keywords = content.focusKeyword.trim() ? [content.focusKeyword.trim()] : undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: BOUTIQUE_NAME,
      locale: 'fr_CA',
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

/** Données structurées FAQPage (rich snippets Google) à partir des FAQ de la page. */
export function buildFaqJsonLd(offering: OfferingView) {
  const content = buildServiceLandingContent(offering);
  const faqs = content.faqs.filter((f) => f.question && f.answer);
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** Fil d'Ariane structuré (BreadcrumbList) : Accueil › Séances/École › Service. */
export function buildBreadcrumbJsonLd(offering: OfferingView) {
  const isFormation = offering.detailHref.startsWith('/ecole');
  const sectionName = isFormation ? 'École de Sorcellerie' : 'Séances';
  const sectionPath = isFormation ? '/ecole' : '/seances';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: sectionName, item: `${SITE_URL}${sectionPath}` },
      {
        '@type': 'ListItem',
        position: 3,
        name: offering.name,
        item: `${SITE_URL}${offering.detailHref}`,
      },
    ],
  };
}

export function buildServiceJsonLd(offering: OfferingView) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: offering.name,
    description: offering.description,
    provider: {
      '@type': 'Person',
      name: offering.practitionerName,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Québec',
    },
    url: `${SITE_URL}${offering.detailHref}`,
    offers: {
      '@type': 'Offer',
      price: offering.price.toFixed(2),
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}${offering.bookingHref}`,
    },
  };
}
