/**
 * Seed des 16 services depuis le fichier Excel services-noctura.xlsx.
 *
 * Idempotent : upsert par slug. Recrée OfferingProvider à chaque exécution
 * pour refléter les changements de praticien·ne·s.
 *
 * Préalable :
 *   - Schema mis à jour (priceForTwo, pricePackage, etc.) — `npx prisma db push`
 *   - Noctura existe (scripts/replace-practitioners-noctura.ts)
 *   - Eiraween + Bohemia existent (scripts/create-practitioners-from-excel.ts)
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/seed-offerings-from-excel.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type Mode = 'IN_PERSON' | 'VIRTUAL';

interface ServiceSeed {
  slug: string;
  name: string;
  type: string;
  practitionerSlugs: string[]; // premier = "primaire", reste = providers additionnels
  numSessions: number | null;
  price: number;
  priceForTwo: number | null;
  pricePackage: number | null;
  pricePackageMsrp: number | null;
  durationMinutes: number;
  modes: Mode[];
  capacity: number;
  description: string;
  emoji: string;
  sortOrder: number;
}

// Données extraites directement du fichier Excel services-noctura.xlsx
const SERVICES: ServiceSeed[] = [
  {
    slug: 'soin-rituel',
    name: 'Le Soin Rituel',
    type: 'SOIN',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 129.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 90,
    modes: ['IN_PERSON'],
    capacity: 1,
    description: 'Soin énergétique sur chaise à massage avec points de pression et techniques de respiration, faisant appel aux 4 éléments et à la magie naturelle.',
    emoji: 'ᛊ',
    sortOrder: 1,
  },
  {
    slug: 'rituel-fertilite',
    name: 'Rituel de fertilité',
    type: 'SOIN',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 199.99,
    priceForTwo: 349.99,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 90,
    modes: ['IN_PERSON'],
    capacity: 2,
    description: '',
    emoji: 'ᛒ',
    sortOrder: 2,
  },
  {
    slug: 'soin-chantant-sonore',
    name: 'Soin chantant sonore',
    type: 'SOIN',
    practitionerSlugs: ['eiraween'],
    numSessions: null,
    price: 129.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 90,
    modes: ['IN_PERSON'],
    capacity: 1,
    description: '',
    emoji: 'ᛜ',
    sortOrder: 3,
  },
  {
    slug: 'tirage-runes-cartes-combines',
    name: 'Tirage de Runes Futhark & Cartes Divinatoires Combinés',
    type: 'GUIDANCE',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 89.99,
    priceForTwo: 149.99,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: "Tirage de Runes Futhark combiné à un tirage de Cartes de Tarot ou d'Oracle, sélectionné selon l'énergie de la personne rencontrée.",
    emoji: 'ᛈ',
    sortOrder: 4,
  },
  {
    slug: 'tirage-simple',
    name: 'Tirage Simple',
    type: 'GUIDANCE',
    practitionerSlugs: ['noctura', 'eiraween'],
    numSessions: null,
    price: 65.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 30,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: 'Tirage de Cartes divinatoires ou de Runes Futhark pour une question précise.',
    emoji: 'ᚨ',
    sortOrder: 5,
  },
  {
    slug: 'cours-formations',
    name: 'Formations & Cours Privés',
    type: 'COURS',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 89.99,
    priceForTwo: 149.99,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: 'Session individuelle de formation, sur place ou en virtuel, selon vos besoins.',
    emoji: 'ᚱ',
    sortOrder: 6,
  },
  {
    slug: 'formation-runes-futhark',
    name: 'Formation Runes Futhark',
    type: 'COURS',
    practitionerSlugs: ['noctura'],
    numSessions: 20,
    price: 89.99,
    priceForTwo: 149.99,
    pricePackage: 1499,
    pricePackageMsrp: 1799.80,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: '',
    emoji: 'ᚠ',
    sortOrder: 7,
  },
  {
    slug: 'formation-alchimie-spirituelle',
    name: 'Formation Alchimie spirituelle',
    type: 'COURS',
    practitionerSlugs: ['noctura'],
    numSessions: 10,
    price: 89.99,
    priceForTwo: 149.99,
    pricePackage: 749,
    pricePackageMsrp: 899.99,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: '',
    emoji: 'ᛃ',
    sortOrder: 8,
  },
  {
    slug: 'formation-dons-psychiques',
    name: 'Formation Dons psychiques',
    type: 'COURS',
    practitionerSlugs: ['noctura'],
    numSessions: 5,
    price: 89.99,
    priceForTwo: 149.99,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: '',
    emoji: 'ᛟ',
    sortOrder: 9,
  },
  {
    slug: 'formation-tarot-pratique',
    name: 'Formation Tarot Pratique',
    type: 'COURS',
    practitionerSlugs: ['noctura'],
    numSessions: 30,
    price: 89.99,
    priceForTwo: 149.99,
    pricePackage: 2249,
    pricePackageMsrp: 2699.70,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: '',
    emoji: 'ᛏ',
    sortOrder: 10,
  },
  {
    slug: 'cours-publics',
    name: 'Formations & Cours publics',
    type: 'COURS',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 60.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 90,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 15,
    description: '',
    emoji: 'ᚷ',
    sortOrder: 11,
  },
  {
    slug: 'animation-de-groupe',
    name: "Soirée d'Animation",
    type: 'ATELIER',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 349.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 120,
    modes: ['IN_PERSON'],
    capacity: 10,
    description: "Soirée découverte en groupe avec capsules au choix : Tarot, Projection d'énergie, Lithomancie, Runes Futhark. Location de salle incluse.",
    emoji: 'ᛁ',
    sortOrder: 12,
  },
  {
    slug: 'ceremonie-accueil-enfant',
    name: "Cérémonies de Noctura — Cérémonie d'accueil enfant",
    type: 'CEREMONIE',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 449.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 120,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: 'Cérémonies spirituelles personnalisées : baptêmes, funérailles, mariages et autres célébrations.',
    emoji: 'ᚹ',
    sortOrder: 13,
  },
  {
    slug: 'purification-espace',
    name: "Purification d'espace",
    type: 'SERVICE_EXTERIEUR',
    practitionerSlugs: ['noctura'],
    numSessions: null,
    price: 249.99,
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 120,
    modes: ['IN_PERSON'],
    capacity: 1,
    description: '',
    emoji: 'ᚺ',
    sortOrder: 14,
  },
  {
    slug: 'consultation-herboriste',
    name: 'Consultation Herboriste',
    type: 'CONSULTATION',
    practitionerSlugs: ['bohemia'],
    numSessions: null,
    price: 0, // à configurer
    priceForTwo: null,
    pricePackage: null,
    pricePackageMsrp: null,
    durationMinutes: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    description: '',
    emoji: 'ᚦ',
    sortOrder: 15,
  },
];

async function main() {
  console.log('\n🌙 Seed Offerings depuis services-noctura.xlsx\n');

  // 1) Récupérer les IDs des praticiennes par slug
  const allPractitioners = await prisma.practitioner.findMany({
    where: { slug: { in: ['noctura', 'eiraween', 'bohemia'] } },
    include: { user: { select: { firstName: true } } },
  });
  const bySlug: Record<string, string> = {};
  for (const p of allPractitioners) bySlug[p.slug] = p.id;

  for (const slug of ['noctura', 'eiraween', 'bohemia']) {
    if (!bySlug[slug]) {
      console.error(`❌ Praticienne "${slug}" introuvable. Lance d'abord scripts/create-practitioners-from-excel.ts`);
      process.exit(1);
    }
  }
  console.log(`✓ ${allPractitioners.length} praticien·ne·s trouvée·s : ${allPractitioners.map((p) => p.user.firstName).join(', ')}\n`);

  // 2) Supprimer les Offerings existantes avant ré-import (pour refléter les changements de prix/type/etc.)
  const existingOfferings = await prisma.offering.findMany({
    where: { slug: { in: SERVICES.map((s) => s.slug) } },
  });
  if (existingOfferings.length > 0) {
    await prisma.offeringProvider.deleteMany({
      where: { offeringId: { in: existingOfferings.map((o) => o.id) } },
    });
    await prisma.offering.deleteMany({
      where: { id: { in: existingOfferings.map((o) => o.id) } },
    });
    console.log(`🗑  ${existingOfferings.length} Offering(s) existante(s) supprimée(s) pour ré-import propre\n`);
  }

  // 3) Créer les services
  let created = 0;
  for (const s of SERVICES) {
    const primaryId = bySlug[s.practitionerSlugs[0]];
    const additionalIds = s.practitionerSlugs.slice(1).map((sl) => bySlug[sl]).filter(Boolean);

    const offering = await prisma.offering.create({
      data: {
        practitionerId: primaryId,
        type: s.type,
        slug: s.slug,
        name: s.name,
        description: s.description || s.name,
        longDescription: '',
        durationMinutes: s.durationMinutes,
        bufferMinutes: 15,
        price: s.price,
        priceForTwo: s.priceForTwo,
        pricePackage: s.pricePackage,
        pricePackageMsrp: s.pricePackageMsrp,
        numSessions: s.numSessions,
        currency: 'CAD',
        modes: s.modes,
        capacity: s.capacity,
        colorHex: '#6B3FA0',
        emoji: s.emoji,
        imageUrl: null,
        features: [],
        isActive: true,
        isFeatured: false,
        sortOrder: s.sortOrder,
      },
    });

    // Lier les praticiennes additionnelles
    for (const provId of additionalIds) {
      await prisma.offeringProvider.create({
        data: { offeringId: offering.id, practitionerId: provId },
      });
    }

    const provLabel = s.practitionerSlugs.length === 1
      ? s.practitionerSlugs[0]
      : `${s.practitionerSlugs[0]} (+${additionalIds.length})`;
    const priceLabel = s.priceForTwo ? `${s.price}$ / ${s.priceForTwo}$ duo` : `${s.price}$`;
    const packageLabel = s.pricePackage ? ` / forfait ${s.pricePackage}$` : '';
    console.log(`   ✓  ${s.slug.padEnd(35)} ${s.type.padEnd(20)} ${provLabel.padEnd(20)} ${priceLabel}${packageLabel}`);
    created++;
  }

  console.log(`\n📊 ${created} Offering(s) créées avec succès.`);
  console.log(`\n✨ Seed terminé.\n`);
}

main()
  .catch((e) => { console.error('\n❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
