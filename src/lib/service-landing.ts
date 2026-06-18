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
  faqs: Array<{ question: string; answer: string }>;
}

export function buildServiceLandingContent(offering: OfferingView): ServiceLandingContent {
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
      pillarsTitle: 'Ce que le rituel vient toucher',
      processTitle: 'Le passage du soin',
      faqTitle: 'Questions avant de franchir le seuil',
      finalTitle: "Ce que tu portes n'a pas à rester en toi",
      finalText:
        "Dans le silence du rituel, les fardeaux perdent leur emprise. Ce que tu portais seul est reconnu, transmuté, puis confié aux forces qui savent dissoudre l'ombre.",
      ctaLabel: 'Réserver le soin',
      heroImage: serviceImage,
      mobileImage: serviceImage,
      imageAlt: 'Noctura, prêtresse de La Voie des Arcanes, guidant le Soin Rituel',
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
  const title = `${offering.name} avec Noctura | La Voie des Arcanes`;
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
      name: 'Noctura',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Québec',
    },
    url: `${SITE_URL}${offering.detailHref}`,
    offers: {
      '@type': 'Offer',
      price: offering.priceLabel.replace(/[^0-9.,]/g, '').replace(',', '.'),
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}${offering.bookingHref}`,
    },
  };
}
