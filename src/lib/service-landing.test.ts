import assert from 'node:assert/strict';
import {
  buildServiceJsonLd,
  buildServiceLandingContent,
  buildServiceLandingMetadata,
  buildFaqJsonLd,
  buildBreadcrumbJsonLd,
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
assert.match(content.intro, /expérience spirituelle/);
// Soin Rituel : hero immersif activé par défaut (fond + personnage + runes).
assert.match(content.backgroundUrl ?? '', /soin-rituel-fond/);
assert.match(content.characterUrl ?? '', /soin-rituel-personnage/);
assert.match(content.faqImageUrl ?? '', /soin-rituel-faq/);
assert.ok(content.pillarRunes.length > 0);
// Soin Rituel : icônes-symboles dorées par défaut devant les piliers.
assert.ok(content.pillarIcons.length > 0);
assert.match(content.pillarIcons[0], /\/images\/services\/arcane\/icons\//);
// Section « bienfaits » : par défaut elle reprend la liste des piliers (features).
assert.deepEqual(content.benefits, soinRituel.features);
// Le titre de la section du bas décrit des intentions, sans promettre de bienfaits.
assert.match(content.pillarsTitle, /intentions/i);
// Conformité Meta : la page décrit une expérience sans diagnostiquer le visiteur
// ni promettre un résultat certain ou médical.
const soinRituelCopy = JSON.stringify(content);
assert.doesNotMatch(soinRituelCopy, /est-ce que tu te reconnais/i);
assert.doesNotMatch(soinRituelCopy, /tu te sens épuisé/i);
assert.doesNotMatch(soinRituelCopy, /a été créé pour toi/i);
assert.doesNotMatch(soinRituelCopy, /bienfaits que le rituel procure/i);
assert.match(soinRituelCopy, /ne remplace pas.*professionnel.*santé/i);

// Les anciennes personnalisations enregistrées sont neutralisées à l'affichage
// sans supprimer les autres réglages de la page.
const legacyRiskyContent = buildServiceLandingContent({
  ...soinRituel,
  landing: {
    subtitle: 'LIBÉRATION, SÉRÉNITÉ, TRANSFORMATION',
    intro:
      'Un soin en profondeur précédé par un rituel. Une séance qui apporte compréhension et changement véritable à long terme.',
    recognitionTitle: 'EST-CE QUE TU TE RECONNAIS ?',
    recognitionIntro: 'Hypersensible, empathique, éponge, syndrome du sauveur(e)...',
    recognitionItems: [
      'Tu es souvent malade sans aucune raison.',
      'Tu cherches encore des réponses après avoir vu un médecin et/ou des spécialistes.',
    ],
    recognitionFinalText: "Si tu te reconnais dans l'un de ces énoncés, ce soin est conçu pour toi.",
    pillarsTitle: 'BIENFAITS DU SOIN RITUEL',
    benefits: ['DÉPARASITAGE', 'RELATIONS AMÉLIORÉES'],
    titleFont: 'cinzel',
  },
});
const legacyRiskyCopy = JSON.stringify(legacyRiskyContent);
assert.doesNotMatch(legacyRiskyCopy, /malade sans aucune raison|médecin|déparasitage|relations améliorées/i);
assert.match(legacyRiskyContent.intro, /ressentis peuvent varier/i);
assert.equal(legacyRiskyContent.titleFont, 'cinzel');

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
// Service générique sans image de fond → hero classique (pas d'immersif).
assert.equal(genContent.backgroundUrl, null);
assert.equal(genContent.characterUrl, null);
assert.equal(genContent.faqImageUrl, null);
// Service générique : pas d'icônes par défaut (le client en ajoutera depuis l'admin).
assert.deepEqual(genContent.pillarIcons, []);

// --- Cas overrides : textes personnalisés depuis l'admin ---
const personnalise: OfferingView = {
  ...generique,
  landing: {
    eyebrow: 'Mon eyebrow',
    sanctuaryTitle: 'Mon titre de sanctuaire',
    finalText: 'Mon texte final',
    backgroundUrl: '/images/services/mon-fond.jpg',
    characterUrl: '/images/services/mon-perso.webp',
    pillarRunes: ['ᚠ', 'ᚢ'],
    pillarIcons: ['/img/a.webp', '/img/b.webp'],
    benefits: ['Bienfait 1', 'Bienfait 2', 'Bienfait 3'],
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
// Le hero immersif s'active aussi pour un service générique si on lui donne un fond.
assert.equal(persoContent.backgroundUrl, '/images/services/mon-fond.jpg');
assert.equal(persoContent.characterUrl, '/images/services/mon-perso.webp');
assert.deepEqual(persoContent.pillarRunes, ['ᚠ', 'ᚢ']);
assert.deepEqual(persoContent.pillarIcons, ['/img/a.webp', '/img/b.webp']);
// Les bienfaits sont indépendants des piliers (features) : éditer l'un ne touche pas l'autre.
assert.deepEqual(persoContent.benefits, ['Bienfait 1', 'Bienfait 2', 'Bienfait 3']);
assert.notDeepEqual(persoContent.benefits, generique.features);
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

// pillarIcons : on garde les vides pour l'alignement si au moins une icône existe…
const parsedIcons = parseLandingOverrides({ pillarIcons: ['/x.webp', '', ' /y.webp '] });
assert.deepEqual(parsedIcons.pillarIcons, ['/x.webp', '', '/y.webp']);
// …mais on ignore une liste entièrement vide.
const parsedEmptyIcons = parseLandingOverrides({ pillarIcons: ['', '  '] });
assert.equal(parsedEmptyIcons.pillarIcons, undefined);

// --- SEO : champs vides par défaut + métadonnées auto ---
assert.equal(content.metaTitle, '');
assert.equal(content.metaDescription, '');
assert.equal(content.focusKeyword, '');
const autoMeta = buildServiceLandingMetadata(soinRituel);
assert.equal(autoMeta.title, 'Le Soin Rituel avec Noctura | La Voie des Arcanes');
assert.ok(typeof autoMeta.description === 'string' && autoMeta.description.length > 0);

// --- SEO : les overrides personnalisés priment sur l'auto ---
const seoOffering: OfferingView = {
  ...soinRituel,
  landing: {
    metaTitle: 'Soin Rituel Saint-Eustache | Libération énergétique',
    metaDescription: 'Une libération intérieure guidée par Noctura : déparasitage et apaisement.',
    focusKeyword: 'soin rituel',
    ogImage: '/images/og/soin.jpg',
  },
};
const seoContent = buildServiceLandingContent(seoOffering);
assert.equal(seoContent.metaTitle, 'Soin Rituel Saint-Eustache | Libération énergétique');
assert.equal(seoContent.focusKeyword, 'soin rituel');
const seoMeta = buildServiceLandingMetadata(seoOffering);
assert.equal(seoMeta.title, 'Soin Rituel Saint-Eustache | Libération énergétique');
assert.equal(
  seoMeta.description,
  'Une libération intérieure guidée par Noctura : déparasitage et apaisement.',
);
assert.deepEqual(seoMeta.keywords, ['soin rituel']);

// --- JSON-LD FAQPage : une entrée par FAQ ---
const faqLd = buildFaqJsonLd(soinRituel);
assert.ok(faqLd);
assert.equal(faqLd!['@type'], 'FAQPage');
assert.equal(faqLd!.mainEntity.length, content.faqs.length);
assert.equal(faqLd!.mainEntity[0]['@type'], 'Question');

// --- JSON-LD BreadcrumbList : 3 niveaux, section Séances pour un soin ---
const crumb = buildBreadcrumbJsonLd(soinRituel);
assert.equal(crumb['@type'], 'BreadcrumbList');
assert.equal(crumb.itemListElement.length, 3);
assert.equal(crumb.itemListElement[1].name, 'Séances');
assert.equal(crumb.itemListElement[2].name, 'Le Soin Rituel');

// --- Sauts de ligne : conservés dans le contenu, aplatis dans la méta-description ---
const multiligne: OfferingView = {
  ...soinRituel,
  landing: {
    intro: 'Première ligne.\nDeuxième ligne.',
    faqs: [{ question: 'Q ?', answer: 'Para 1.\n\nPara 2.' }],
    steps: [{ number: '01', title: 'Étape', text: 'Ligne A.\nLigne B.' }],
  },
};
// Les retours-ligne internes survivent au parsing (contrat de stockage).
const multiParsed = parseLandingOverrides(multiligne.landing);
assert.equal(multiParsed.intro, 'Première ligne.\nDeuxième ligne.');
assert.equal(multiParsed.faqs?.[0].answer, 'Para 1.\n\nPara 2.');
assert.equal(multiParsed.steps?.[0].text, 'Ligne A.\nLigne B.');
const multiContent = buildServiceLandingContent(multiligne);
assert.equal(multiContent.intro, 'Première ligne.\nDeuxième ligne.');
assert.equal(multiContent.faqs[0].answer, 'Para 1.\n\nPara 2.');
// La méta-description auto est aplatie sur une seule ligne (aucun '\n').
const multiMeta = buildServiceLandingMetadata(multiligne);
assert.equal(multiMeta.description, 'Première ligne. Deuxième ligne.');
assert.doesNotMatch(String(multiMeta.description), /\n/);

// --- Polices : valeurs par défaut ---
assert.equal(content.titleFont, 'cinzel-decorative');
assert.equal(content.labelFont, 'cinzel');
assert.equal(content.bodyFont, 'cormorant');

// --- Polices : parseLandingOverrides conserve une clé valide, ignore une invalide ---
const fontOverrides = parseLandingOverrides({ titleFont: 'medieval', labelFont: 'pas-une-police' });
assert.equal(fontOverrides.titleFont, 'medieval');
assert.equal(fontOverrides.labelFont, undefined);

// --- Polices : override appliqué, champ non surchargé garde le défaut ---
const themedOffering: OfferingView = {
  ...soinRituel,
  landing: { titleFont: 'medieval', bodyFont: 'philosopher' },
};
const themed = buildServiceLandingContent(themedOffering);
assert.equal(themed.titleFont, 'medieval');
assert.equal(themed.bodyFont, 'philosopher');
assert.equal(themed.labelFont, 'cinzel');

console.log('service-landing tests passed');
