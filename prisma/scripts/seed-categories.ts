/**
 * Seed des catégories de produits.
 *
 * Crée/met à jour les 9 catégories historiquement hardcodées dans
 * src/app/admin/produits/page.tsx. Idempotent : peut être ré-exécuté
 * sans dupliquer.
 *
 * Usage :
 *   npm run db:seed:categories
 *
 * Remarque : les `cloverCategoryId` sont laissés à null. Pour les lier
 * aux catégories Clover existantes, soit (a) on les édite manuellement
 * depuis l'admin, soit (b) on lance une sync depuis /admin/clover qui
 * tente un match par nom.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_CATEGORIES: Array<{
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
}> = [
  { slug: 'cristaux', name: 'Pierres et Cristaux', description: 'Cristaux bruts, polis, géodes et pendentifs', displayOrder: 10 },
  { slug: 'runes', name: 'Runes', description: 'Runes vikings, sets et runes individuelles', displayOrder: 20 },
  { slug: 'tarot', name: 'Tarot', description: 'Jeux de tarot classiques et thématiques', displayOrder: 30 },
  { slug: 'oracle', name: 'Oracles', description: 'Cartes oracles et guides divinatoires', displayOrder: 40 },
  { slug: 'herbes-encens', name: 'Herbes & Encens', description: 'Herbes séchées, encens et fumigations', displayOrder: 50 },
  { slug: 'bougies', name: 'Bougies', description: 'Bougies rituelles et magiques', displayOrder: 60 },
  { slug: 'bijoux', name: 'Bijoux', description: 'Bijoux esotériques et pendentifs protecteurs', displayOrder: 70 },
  { slug: 'orgonites', name: 'Orgonites', description: 'Orgonites pyramidales et énergétiques', displayOrder: 80 },
  { slug: 'baguettes-magiques', name: 'Baguettes Magiques', description: 'Baguettes magiques en bois et cristal', displayOrder: 90 },
];

async function main() {
  console.log('[seed-categories] Seeding 9 catégories de base...');

  let created = 0;
  let updated = 0;

  for (const seed of SEED_CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { slug: seed.slug },
      create: seed,
      update: {
        name: seed.name,
        description: seed.description,
        displayOrder: seed.displayOrder,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
      console.log(`  + créée : ${result.slug} → "${result.name}"`);
    } else {
      updated++;
      console.log(`  ~ mise à jour : ${result.slug} → "${result.name}"`);
    }
  }

  console.log(`[seed-categories] Terminé. ${created} créée(s), ${updated} mise(s) à jour.`);
}

main()
  .catch((err) => {
    console.error('[seed-categories] ÉCHEC :', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
