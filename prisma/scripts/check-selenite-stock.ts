import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const selenites = await prisma.product.findMany({
    where: { name: { contains: 'lenite', mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      inStock: true,
      productType: true,
      syncToClover: true,
      cloverId: true,
      cloverSyncedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  console.log('═══════════════════════════════════════════');
  console.log('  PRODUITS SELENITE');
  console.log('═══════════════════════════════════════════');
  for (const p of selenites) {
    console.log('');
    console.log(`  ${p.name}`);
    console.log(`    id            : ${p.id}`);
    console.log(`    SKU           : ${p.sku ?? '(null)'}`);
    console.log(`    stockQuantity : ${p.stockQuantity ?? '(null)'}`);
    console.log(`    inStock       : ${p.inStock}`);
    console.log(`    productType   : ${p.productType}`);
    console.log(`    syncToClover  : ${p.syncToClover}`);
    console.log(`    cloverId      : ${p.cloverId ?? '(null)'}`);
    console.log(`    cloverSyncedAt: ${p.cloverSyncedAt?.toISOString() ?? '(null)'}`);
    console.log(`    updatedAt     : ${p.updatedAt.toISOString()}`);
    console.log(`    createdAt     : ${p.createdAt.toISOString()}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  5 DERNIERS CLOVER SYNC LOGS');
  console.log('═══════════════════════════════════════════');
  const logs = await prisma.cloverSyncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { startedAt: true, mode: true, triggeredBy: true, status: true, itemsFetched: true, itemsUpdated: true, itemsSkipped: true, errorsCount: true },
  });
  for (const log of logs) {
    console.log(`  ${log.startedAt.toISOString().slice(0, 19)} | ${log.triggeredBy?.padEnd(10)} | ${log.mode?.padEnd(8)} | ${log.status?.padEnd(8)} | fetched=${log.itemsFetched} updated=${log.itemsUpdated} skipped=${log.itemsSkipped} errors=${log.errorsCount}`);
  }

  await prisma.$disconnect();
})();
