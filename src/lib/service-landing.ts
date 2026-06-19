import type { Metadata } from 'next';
import type { OfferingView } from '@/lib/offerings';

const SITE_URL = 'https://www.runesetmagie.ca';

export interface ServiceLandingContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  sanctuaryTitle: string;
  sanctuaryText: string;
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
  sanctuaryTitle?: string;
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
}

/** Champs texte simples surchargeables (un par bouton ✦). */
export const LANDING_TEXT_FIELDS = [
  'eyebrow',
  'subtitle',
  'sanctuaryTitle',
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
] as const;

/** Champs listes structurées surchargeables. */
export const LANDING_LIST_FIELDS = ['steps', 'faqs', 'pillarRunes', 'pillarIcons', 'benefits'] as const;

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
    sanctuaryTitle: overrides.sanctuaryTitle ?? base.sanctuaryTitle,
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
  return applyOverrides(base, offering.landing ?? {});
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
      subtitle: 'Une libération intérieure guidée par Noctura, prêtresse de La Voie des Arcanes',
      intro:
        "Tu franchis le seuil avec ce que ton âme n'arrive plus à porter. Noctura t'accueille, écoute l'invisible, et t'aide à rendre au néant ce qui ne t'appartient plus.",
      sanctuaryTitle: 'Un seuil où rien en toi ne sera jugé',
      sanctuaryText:
        "Entre les mains de Noctura, les fardeaux ne sont pas jugés: ils sont entendus. Le rituel devient alors un seuil où l'âme se déleste, se réaccorde et retrouve son souffle.",
      pillarsTitle: 'Les bienfaits que le rituel procure',
      processTitle: 'Le passage du soin',
      faqTitle: 'Questions avant de franchir le seuil',
      finalTitle: "Ce que tu portes n'a pas à rester en toi",
      finalText:
        "Dans le silence du rituel, les fardeaux perdent leur emprise. Ce que tu portais seul est reconnu, transmuté, puis confié aux forces qui savent dissoudre l'ombre.",
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
            "Non. Noctura adapte le rituel à ton énergie, à ce que tu portes et à ce que le moment demande.",
        },
      ],
    };
  }

  return {
    eyebrow: 'La Voie des Arcanes présente',
    title: offering.name,
    subtitle: `Une expérience sacrée guidée par ${offering.practitionerName}`,
    intro: offering.description,
    sanctuaryTitle: 'Un espace pour déposer ce qui demande à être vu',
    sanctuaryText: offering.longDescription,
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
  };
}

export function buildServiceLandingMetadata(offering: OfferingView): Metadata {
  const content = buildServiceLandingContent(offering);
  const title = `${offering.name} avec ${offering.practitionerName} | La Voie des Arcanes`;
  const description = content.intro.length > 155 ? `${content.intro.slice(0, 152)}...` : content.intro;
  const url = `${SITE_URL}${offering.detailHref}`;
  const imageUrl = content.heroImage
    ? content.heroImage.startsWith('http')
      ? content.heroImage
      : `${SITE_URL}${content.heroImage}`
    : undefined;
  const images = imageUrl ? [{ url: imageUrl, alt: content.imageAlt }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Runes & Magie',
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
