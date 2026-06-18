import assert from 'node:assert/strict';
import {
  buildServiceJsonLd,
  buildServiceLandingContent,
  buildServiceLandingMetadata,
  parseLandingOverrides,
} from './service-landing';
import type { OfferingView } from './offerings';

const soinRituel: OfferingView = {
  id: 'offering_1',
  slug: 'soin-rituel',
  name: 'Le Soin Rituel',
  emoji: '*',
  description: 'Un soin pour déposer ce qui pèse.',
  longDescription: 'Description longue du soin.',
  price: 125,
  priceLabel: '125.00 $',
  durationLabel: '90 min',
  features: ["Lecture d'âme", 'Chant runique'],
  practitionerName: 'Noctura',
  modes: ['IN_PERSON'],
  isFormation: false,
  sessionsLabel: null,
  bookingHref: '/soins/reserver/noctura?offering=soin-rituel',
  imageUrl: '/images/services/soin-rituel.svg',
  detailHref: '/seances/soin-rituel',
  landing: {},
};

const content = buildServiceLandingContent(soinRituel);
assert.equal(content.ctaLabel, 'Réserver le soin');
assert.match(content.subtitle, /Noctura/);
assert.match(content.intro, /âme n'arrive plus à porter/);

const metadata = buildServiceLandingMetadata(soinRituel);
assert.equal(metadata.title, 'Le Soin Rituel avec Noctura | La Voie des Arcanes');
assert.deepEqual(metadata.alternates, {
  canonical: 'https://www.runesetmagie.ca/seances/soin-rituel',
});

const jsonLd = buildServiceJsonLd(soinRituel);
assert.equal(jsonLd['@type'], 'Service');
assert.equal(jsonLd.provider.name, 'Noctura');
assert.equal(jsonLd.offers.priceCurrency, 'CAD');

// --- Cas générique : autre praticienne + tarif duo ---
const generique: OfferingView = {
  id: 'offering_2',
  slug: 'guidance-runique',
  name: 'Guidance Runique',
  emoji: '*',
  description: 'Une lecture des runes pour éclairer ton chemin.',
  longDescription: 'Description longue de la guidance.',
  price: 90,
  priceLabel: '90.00 $ / 70.00 $ duo',
  durationLabel: '60 min',
  features: ['Tirage runique'],
  practitionerName: 'Annabelle Dionne',
  modes: ['IN_PERSON'],
  isFormation: false,
  sessionsLabel: null,
  bookingHref: '/soins/reserver/annabelle?offering=guidance-runique',
  imageUrl: '/images/services/guidance.jpg',
  detailHref: '/seances/guidance-runique',
  landing: {},
};

const genMeta = buildServiceLandingMetadata(generique);
// Le titre SEO doit refléter la vraie praticienne, pas « Noctura ».
assert.equal(genMeta.title, 'Guidance Runique avec Annabelle Dionne | La Voie des Arcanes');
assert.doesNotMatch(genMeta.title, /Noctura/);

const genJsonLd = buildServiceJsonLd(generique);
assert.equal(genJsonLd.provider.name, 'Annabelle Dionne');
// Le prix duo ne doit pas casser : prix numérique brut attendu.
assert.equal(genJsonLd.offers.price, '90.00');

const genContent = buildServiceLandingContent(generique);
assert.equal(genContent.steps.length, 4);
assert.match(genContent.faqImageAlt, /Guidance Runique/);

// --- Cas overrides : textes personnalisés depuis l'admin ---
const personnalise: OfferingView = {
  ...generique,
  landing: {
    eyebrow: 'Mon eyebrow',
    sanctuaryTitle: 'Mon titre de sanctuaire',
    finalText: 'Mon texte final',
    steps: [
      { number: '01', title: 'Étape A', text: 'Texte A' },
      { number: '02', title: 'Étape B', text: 'Texte B' },
    ],
    faqs: [{ question: 'Q1 ?', answer: 'R1.' }],
  },
};

const persoContent = buildServiceLandingContent(personnalise);
assert.equal(persoContent.eyebrow, 'Mon eyebrow');
assert.equal(persoContent.sanctuaryTitle, 'Mon titre de sanctuaire');
assert.equal(persoContent.finalText, 'Mon texte final');
assert.equal(persoContent.steps.length, 2);
assert.equal(persoContent.steps[1].title, 'Étape B');
assert.equal(persoContent.faqs.length, 1);
assert.equal(persoContent.faqs[0].question, 'Q1 ?');
// Les champs non surchargés gardent le défaut.
assert.match(persoContent.processTitle, /déroulement/);

// parseLandingOverrides nettoie les entrées invalides.
const parsed = parseLandingOverrides({
  eyebrow: '  ',
  faqTitle: 'Titre FAQ',
  steps: [{ title: 'X', text: '' }, { title: '', text: '' }],
  faqs: 'pas une liste',
});
assert.equal(parsed.eyebrow, undefined);
assert.equal(parsed.faqTitle, 'Titre FAQ');
assert.equal(parsed.steps?.length, 1);
assert.equal(parsed.faqs, undefined);

console.log('service-landing tests passed');
