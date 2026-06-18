import assert from 'node:assert/strict';
import {
  buildServiceJsonLd,
  buildServiceLandingContent,
  buildServiceLandingMetadata,
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

console.log('service-landing tests passed');
