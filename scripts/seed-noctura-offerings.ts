/**
 * Seed Phase 2 MVP — Migration des 6 services hardcodés vers la table Offering V2.
 *
 * Chaque service est créé en tant qu'Offering lié à Noctura, avec :
 *   - type     : SOIN | COURS | CEREMONIE
 *   - modes    : IN_PERSON et/ou VIRTUAL selon la nature du service
 *   - capacity : 1 pour les soins individuels, plus pour les groupes
 *   - price    : prix de base (en dollars)
 *   - durationMinutes : durée standard
 *
 * Idempotent — vérifie par slug avant de créer.
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/seed-noctura-offerings.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface OfferingSeed {
  slug: string;
  name: string;
  type: 'SOIN' | 'COURS' | 'CEREMONIE';
  description: string;
  longDescription: string;
  durationMinutes: number;
  price: number;
  modes: ('IN_PERSON' | 'VIRTUAL')[];
  capacity: number;
  emoji: string;
  imageUrl: string;
  features: string[];
  sortOrder: number;
  isFeatured: boolean;
}

const SEEDS: OfferingSeed[] = [
  {
    slug: 'soin-rituel',
    name: 'Le Soin Rituel',
    type: 'SOIN',
    description:
      "Soin énergétique sur chaise à massage avec points de pression et techniques de respiration, faisant appel aux 4 éléments et à la magie naturelle.",
    longDescription:
      "Le Soin Rituel est une expérience unique et profondément personnalisée. Sur chaise à massage, Noctura travaille avec des points de pression et des techniques de respiration, faisant appel aux 4 éléments et à la magie naturelle. Plusieurs outils spirituels sont utilisés selon chaque cas : bol chantant, baguettes de radiesthésie, bâtons d'Horus, pierres et cristaux, musique et chants inspirés, fumigation d'herbes sacrées, et bien plus encore. Chaque séance est unique et s'adapte aux besoins de chaque personne rencontrée.",
    durationMinutes: 90,
    price: 125,
    modes: ['IN_PERSON'], // chaise à massage = obligatoirement présentiel
    capacity: 1,
    emoji: 'ᛊ',
    imageUrl: '/images/services/soin-rituel.svg',
    features: [
      'Soin énergétique sur chaise à massage',
      'Points de pression et techniques de respiration',
      'Travail avec les 4 éléments et la magie naturelle',
      'Bol chantant, baguettes de radiesthésie, bâtons d\'Horus',
      'Pierres et cristaux de guérison',
    ],
    sortOrder: 1,
    isFeatured: true,
  },
  {
    slug: 'tirage-runes-cartes-combines',
    name: 'Tirage de Runes Futhark & Cartes Divinatoires Combinés',
    type: 'SOIN',
    description:
      "Tirage de Runes Futhark combiné à un tirage de Cartes de Tarot ou d'Oracle, sélectionné selon l'énergie de la personne rencontrée.",
    longDescription:
      "Le tirage combine les Runes Futhark, un art divinatoire nordique, à un tirage de Cartes de Tarot ou d'Oracle sélectionné par Noctura selon l'énergie de la personne rencontrée. Les Runes Futhark sont un alphabet composé de 25 lettres sacrées qui existent depuis plus de 3 millénaires.",
    durationMinutes: 60,
    price: 95,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    emoji: 'ᛈ',
    imageUrl: '/images/services/tirage-tarot-runes.svg',
    features: [
      'Tirage de Runes Futhark',
      'Combiné à un tirage de Cartes de Tarot ou d\'Oracle',
      'Sélection du jeu selon votre énergie personnelle',
      'Lecture de plusieurs destins possibles',
    ],
    sortOrder: 2,
    isFeatured: true,
  },
  {
    slug: 'tirage-simple',
    name: 'Tirage Simple',
    type: 'SOIN',
    description:
      "Tirage de Cartes divinatoires ou de Runes Futhark pour une question précise.",
    longDescription:
      "Le Tirage Simple est idéal pour obtenir une réponse claire et directe à une question précise. Vous choisissez votre support — Cartes divinatoires ou Runes Futhark — et Noctura réalise un tirage ciblé pour éclairer votre situation.",
    durationMinutes: 30,
    price: 60,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    emoji: 'ᚨ',
    imageUrl: '/images/services/tirage-simple.svg',
    features: [
      'Cartes divinatoires ou Runes Futhark au choix',
      'Pour une question précise',
      'Réponse claire et directe',
      'Disponible en personne ou à distance',
    ],
    sortOrder: 3,
    isFeatured: false,
  },
  {
    slug: 'cours-formations',
    name: 'Formations & Cours Privés',
    type: 'COURS',
    description:
      "Session individuelle de formation, sur place ou en virtuel, selon vos besoins.",
    longDescription:
      "Les Formations & Cours Privés vous offrent un apprentissage personnalisé dans l'univers énergétique et spirituel. Les sessions couvrent : initiation aux runes Futhark, lecture du Tarot, magie des cristaux et lithothérapie, herbalisme magique, création de rituels, et bien plus.",
    durationMinutes: 60,
    price: 89.99,
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    emoji: 'ᚱ',
    imageUrl: '/images/services/cours-formations.svg',
    features: [
      'Session individuelle personnalisée',
      'Disponible sur place ou en virtuel',
      'Initiation aux runes et au Futhark ancien',
      'Apprentissage de la lecture du Tarot',
      'Magie des cristaux et lithothérapie',
    ],
    sortOrder: 4,
    isFeatured: false,
  },
  {
    slug: 'animation-de-groupe',
    name: 'Soirée d\'Animation',
    type: 'CEREMONIE',
    description:
      "Soirée découverte en groupe avec capsules au choix : Tarot, Projection d'énergie, Lithomancie, Runes Futhark. Location de salle incluse.",
    longDescription:
      "Les Soirées d'Animation de groupe sont des expériences uniques à vivre entre amis, en famille ou entre collègues. La Salle de la Chapelle Cachée est réservée pour vous, avec tables et chaises fournies, frigo et accès 60 min avant pour la décoration. L'animation dure 2 heures en 2 blocs avec une pause de 30 minutes. Tarif selon la taille du groupe : à partir de 245 $ pour 4 personnes.",
    durationMinutes: 120,
    price: 245, // prix de base pour 4 personnes
    modes: ['IN_PERSON'], // location de salle physique
    capacity: 10,
    emoji: 'ᛁ',
    imageUrl: '/images/services/animation-groupe.svg',
    features: [
      '4 personnes : 245$ / 2 heures',
      '5 personnes : 300$ / 2 heures',
      '6 personnes : 350$ / 2 heures',
      '7 personnes : 400$ / 3 heures',
      '10 personnes : 500$ / 3 heures',
      'Capsules au choix : Tarot, Projection, Lithomancie, Runes',
      'Location de salle, tables et chaises incluses',
    ],
    sortOrder: 5,
    isFeatured: false,
  },
  {
    slug: 'ceremonies',
    name: 'Cérémonies de Noctura',
    type: 'CEREMONIE',
    description:
      "Cérémonies spirituelles personnalisées : baptêmes, funérailles, mariages et autres célébrations.",
    longDescription:
      "Chaque cérémonie est écrite, préparée et guidée sur mesure. L'approche Noctura allie rituels symboliques, guidance intuitive et soutien aux familles ou aux couples. Que ce soit pour un baptême, des funérailles, un mariage ou toute autre célébration de passage, chaque cérémonie est conçue en étroite collaboration.",
    durationMinutes: 120, // variable, à confirmer au moment du rdv
    price: 449.99, // prix de base (baptême, funérailles, autres)
    modes: ['IN_PERSON', 'VIRTUAL'],
    capacity: 1,
    emoji: 'ᚹ',
    imageUrl: '/images/services/ceremonies.svg',
    features: [
      'Baptême : 449.99$ — cérémonie personnalisée',
      'Funérailles : 449.99$ — guidance spirituelle',
      'Mariage : 924.99$ — mariage légal, conception personnalisée',
      'Autres : 449.99$ — renouvellements, rituels saisonniers',
      'Rencontre gratuite préalable incluse',
      'Plans de paiement disponibles pour les mariages',
    ],
    sortOrder: 6,
    isFeatured: true,
  },
];

async function main() {
  console.log('\n🌙 Seed Offerings — Phase 2 MVP\n');

  // Trouve Noctura
  const noctura = await prisma.practitioner.findUnique({
    where: { slug: 'noctura' },
    include: { user: true },
  });
  if (!noctura) {
    console.error('❌ Praticienne "noctura" introuvable. Lance d\'abord scripts/replace-practitioners-noctura.ts');
    process.exit(1);
  }
  console.log(`✓ Praticienne trouvée : ${noctura.user.firstName} ${noctura.user.lastName} (id: ${noctura.id})\n`);

  let created = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    const existing = await prisma.offering.findUnique({ where: { slug: seed.slug } });
    if (existing) {
      console.log(`   ⏭  ${seed.slug} — existe déjà (skip)`);
      skipped++;
      continue;
    }

    await prisma.offering.create({
      data: {
        practitionerId: noctura.id,
        type: seed.type,
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        longDescription: seed.longDescription,
        durationMinutes: seed.durationMinutes,
        bufferMinutes: 15,
        price: seed.price,
        currency: 'CAD',
        modes: seed.modes,
        capacity: seed.capacity,
        colorHex: '#6B3FA0',
        emoji: seed.emoji,
        imageUrl: seed.imageUrl,
        features: seed.features,
        isActive: true,
        isFeatured: seed.isFeatured,
        sortOrder: seed.sortOrder,
      },
    });
    console.log(`   ✓  ${seed.slug} — créé (${seed.type}, ${seed.price}$, ${seed.durationMinutes} min, modes: ${seed.modes.join('+')})`);
    created++;
  }

  // Vérif finale
  const total = await prisma.offering.count({
    where: { practitionerId: noctura.id, isActive: true },
  });
  console.log(`\n📊 Total Offerings actifs pour Noctura : ${total}`);
  console.log(`\n✨ Seed terminé — ${created} créés, ${skipped} déjà présents.\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Erreur :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
