import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('  TOUTES LES CATÉGORIES (avec cloverCategoryId)');
  console.log('═══════════════════════════════════════════');
  const cats = await prisma.category.findMany({
    select: { slug: true, name: true, cloverCategoryId: true, cloverSyncedAt: true },
    orderBy: { displayOrder: 'asc' },
  });
  for (const c of cats) {
    const sync = c.cloverCategoryId ? `✓ ${c.cloverCategoryId.slice(0, 8)}` : '✗ NON LIÉE';
    console.log(`  ${c.slug.padEnd(25)} | ${c.name.padEnd(30)} | ${sync}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  3 PRODUITS COURS (récents)');
  console.log('═══════════════════════════════════════════');
  const cours = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'cours', mode: 'insensitive' } },
        { name: { contains: 'formation', mode: 'insensitive' } },
      ],
    },
    select: { sku: true, name: true, category: true, productType: true, syncToClover: true, cloverId: true, cloverSyncedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  for (const p of cours) {
    console.log(`  SKU ${p.sku} | ${p.name.slice(0, 35).padEnd(35)} | cat=${p.category.padEnd(20)} | type=${p.productType.padEnd(8)} | sync=${p.syncToClover} | cloverId=${p.cloverId ? p.cloverId.slice(0, 10) : '(null)'}`);
  }

  await prisma.$disconnect();
})();
