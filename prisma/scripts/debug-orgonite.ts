import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('1) Derniers produits créés (10)');
  console.log('═══════════════════════════════════════════');
  const recent = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      category: true,
      productType: true,
      syncToClover: true,
      cloverId: true,
      cloverSyncedAt: true,
      sku: true,
      createdAt: true,
    },
  });
  for (const p of recent) {
    console.log(`  ${p.createdAt.toISOString().slice(0, 19)} | ${p.name.slice(0, 30).padEnd(30)} | cat=${p.category.padEnd(15)} | type=${p.productType.padEnd(13)} | sync=${p.syncToClover} | cloverId=${p.cloverId || '(NULL)'} | sku=${p.sku || '(NULL)'}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('2) Produits orgonite');
  console.log('═══════════════════════════════════════════');
  const orgonites = await prisma.product.findMany({
    where: { category: 'orgonites' },
    select: {
      id: true,
      name: true,
      productType: true,
      syncToClover: true,
      cloverId: true,
      cloverSyncedAt: true,
      sku: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  for (const p of orgonites) {
    console.log(`  ${p.createdAt.toISOString().slice(0, 19)} | ${p.name.slice(0, 30).padEnd(30)} | type=${p.productType.padEnd(13)} | sync=${p.syncToClover} | cloverId=${p.cloverId || '(NULL)'}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('3) Queue Clover (statuts)');
  console.log('═══════════════════════════════════════════');
  const queueByStatus = await prisma.cloverSyncQueue.groupBy({
    by: ['status', 'action'],
    _count: { id: true },
  });
  for (const q of queueByStatus) {
    console.log(`  ${q.status.padEnd(20)} ${q.action.padEnd(20)} → ${q._count.id}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('4) 5 dernières entrées CloverSyncQueue');
  console.log('═══════════════════════════════════════════');
  const recent5 = await prisma.cloverSyncQueue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  for (const q of recent5) {
    console.log(`  ${q.createdAt.toISOString().slice(0, 19)} | action=${q.action.padEnd(18)} | status=${q.status.padEnd(20)} | attempts=${q.attempts} | nextAttempt=${q.nextAttemptAt.toISOString().slice(0, 19)}`);
    if (q.lastError) console.log(`    └─ erreur: ${q.lastError.slice(0, 200)}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('5) Variables env Clover présentes ?');
  console.log('═══════════════════════════════════════════');
  console.log(`  CLOVER_MERCHANT_ID : ${process.env.CLOVER_MERCHANT_ID ? '✓ présent' : '✗ MANQUANT'}`);
  console.log(`  CLOVER_API_TOKEN   : ${process.env.CLOVER_API_TOKEN ? '✓ présent (longueur ' + process.env.CLOVER_API_TOKEN.length + ')' : '✗ MANQUANT'}`);
  console.log(`  CLOVER_REGION      : ${process.env.CLOVER_REGION || '(défaut: us)'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
