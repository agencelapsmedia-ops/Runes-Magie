/**
 * Seed des catégories de services (table ServiceCategory).
 * Reprend les 2 sliders actuels de l'accueil pour que rien ne change :
 *  - « Séances Rituels »      ← soin-rituel, rituel-fertilite, soin-chantant-sonore
 *  - « École de Sorcellerie » ← tous les services de type COURS / ATELIER
 * Les deux sont cochées « afficher sur l'accueil » (showOnHome).
 *
 * Idempotent : si des catégories existent déjà, on ne touche à rien.
 * Lancer :  npx tsx prisma/scripts/seed-service-categories.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.serviceCategory.count();
  if (existing > 0) {
    console.log(`${existing} catégorie(s) déjà présentes — seed ignoré.`);
    return;
  }

  // 1) Séances Rituels (sélection de soins par slug)
  const seances = await prisma.serviceCategory.create({
    data: {
      name: 'Séances Rituels',
      slug: 'seances-rituels',
      emoji: 'ᛊ',
      sortOrder: 10,
      showOnHome: true,
      isActive: true,
    },
  });
  await prisma.offering.updateMany({
    where: { slug: { in: ['soin-rituel', 'rituel-fertilite', 'soin-chantant-sonore'] } },
    data: { categoryId: seances.id },
  });

  // 2) École de Sorcellerie (tous les cours / ateliers)
  const ecole = await prisma.serviceCategory.create({
    data: {
      name: 'École de Sorcellerie',
      slug: 'ecole-de-sorcellerie',
      emoji: 'ᚱ',
      sortOrder: 20,
      showOnHome: true,
      isActive: true,
    },
  });
  await prisma.offering.updateMany({
    where: { type: { in: ['COURS', 'ATELIER'] } },
    data: { categoryId: ecole.id },
  });

  const seancesCount = await prisma.offering.count({ where: { categoryId: seances.id } });
  const ecoleCount = await prisma.offering.count({ where: { categoryId: ecole.id } });
  console.log(`« Séances Rituels » : ${seancesCount} service(s) assigné(s).`);
  console.log(`« École de Sorcellerie » : ${ecoleCount} service(s) assigné(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
