/**
 * Regroupe les oracles et les tarots sous une seule categorie « Cartes divinatoires »,
 * avec un filtre de sous-categorie Oracle / Tarot a l'interieur.
 *
 * Pourquoi : ce sont deux formes du meme type de produit. Les 51 oracles etaient
 * masques depuis le 10 juillet alors qu'ils avaient tous photo, description et prix.
 *
 * Reversible : les anciennes categories `oracle` et `tarot` sont masquees, pas
 * supprimees. Pour revenir en arriere, il suffit de remettre les valeurs de
 * `category` d'origine (voir la sauvegarde ecrite par ce script).
 *
 * Usage : npx tsx scripts/regrouper-cartes-divinatoires.ts
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const prisma = new PrismaClient();

const NOUVELLE = 'cartes-divinatoires';

async function main() {
  // 1) Sauvegarde avant modification — permet un retour en arriere exact.
  const avant = await prisma.product.findMany({
    where: { category: { in: ['oracle', 'tarot'] } },
    select: { id: true, name: true, category: true, subcategory: true },
  });
  const chemin = `scripts/_sauvegarde-cartes-divinatoires-${avant.length}.json`;
  writeFileSync(chemin, JSON.stringify(avant, null, 2), 'utf8');
  console.log(`Sauvegarde de ${avant.length} produits ecrite dans ${chemin}`);

  // 2) La nouvelle categorie, juste apres Pierres et Cristaux (ordre 10).
  const categorie = await prisma.category.upsert({
    where: { slug: NOUVELLE },
    update: { name: 'Cartes divinatoires', isActive: true, displayOrder: 15 },
    create: {
      slug: NOUVELLE,
      name: 'Cartes divinatoires',
      description: 'Oracles et tarots pour la guidance et la divination.',
      isActive: true,
      displayOrder: 15,
    },
  });
  console.log(`Categorie « ${categorie.name} » prete (ordre ${categorie.displayOrder}).`);

  // 3) Bascule des produits. La sous-categorie doit valoir exactement l'identifiant
  //    declare dans categorySubcategories (src/data/products.ts), sinon le filtre
  //    de la boutique ne trouve rien.
  const oracles = await prisma.product.updateMany({
    where: { category: 'oracle' },
    data: { category: NOUVELLE, subcategory: 'oracle' },
  });
  const tarots = await prisma.product.updateMany({
    where: { category: 'tarot' },
    data: { category: NOUVELLE, subcategory: 'tarot' },
  });
  console.log(`Bascules : ${oracles.count} oracles + ${tarots.count} tarots = ${oracles.count + tarots.count}`);

  // 4) Les anciennes categories sont masquees, jamais supprimees : elles portent
  //    un cloverCategoryId dont la sync a besoin.
  await prisma.category.updateMany({
    where: { slug: { in: ['oracle', 'tarot'] } },
    data: { isActive: false },
  });
  console.log('Anciennes categories Oracles et Tarot masquees (non supprimees).');

  // 5) Verification
  const total = await prisma.product.count({ where: { category: NOUVELLE } });
  const sansImage = await prisma.product.count({ where: { category: NOUVELLE, image: '' } });
  const visibles = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: { name: true, displayOrder: true },
  });
  console.log(`\nVerification : ${total} produits dans « Cartes divinatoires », ${sansImage} sans image.`);
  console.log('Categories visibles :', visibles.map((c) => `${c.name} (${c.displayOrder})`).join(' | '));
}

main()
  .catch((e) => {
    console.error('ERREUR :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
