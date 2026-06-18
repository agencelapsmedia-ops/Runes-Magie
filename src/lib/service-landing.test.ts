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

console.log('service-landing tests passed');
