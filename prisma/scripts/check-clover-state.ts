import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.product.count();
  const visible = await prisma.product.count({ where: { inStock: true } });
  const linked = await prisma.product.count({ where: { cloverId: { not: null } } });
  const orphansVisible = await prisma.product.count({ where: { syncToClover: true, cloverId: null, inStock: true } });
  const orphansAll = await prisma.product.count({ where: { syncToClover: true, cloverId: null } });

  console.log('═══════════════════════════════════════════');
  console.log('  ÉTAT ACTUEL DE LA DB');
  console.log('═══════════════════════════════════════════');
  console.log('  Total produits           :', total);
  console.log('  Visibles (inStock=true)  :', visible);
  console.log('  Liés à Clover (cloverId) :', linked);
  console.log('  Orphelins visibles       :', orphansVisible, '← cible du bouton');
  console.log('  Orphelins total          :', orphansAll);
  console.log('');

  console.log('  10 derniers produits ré-synchronisés (par cloverSyncedAt) :');
  const recentSynced = await prisma.product.findMany({
    where: { cloverSyncedAt: { not: null } },
    select: { name: true, cloverId: true, cloverSyncedAt: true, inStock: true, category: true },
    orderBy: { cloverSyncedAt: 'desc' },
    take: 10,
  });
  for (const p of recentSynced) {
    const syncedTime = p.cloverSyncedAt?.toISOString().slice(0, 19) ?? '—';
    console.log(`    ${syncedTime} | ${p.name.slice(0, 35).padEnd(35)} | cat=${p.category.padEnd(20)} | inStock=${p.inStock} | cloverId=${p.cloverId}`);
  }

  console.log('');
  console.log('  Entrées récentes dans CloverSyncQueue :');
  const recentQueue = await prisma.cloverSyncQueue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { createdAt: true, action: true, status: true, productId: true, lastError: true },
  });
  for (const q of recentQueue) {
    console.log(`    ${q.createdAt.toISOString().slice(0, 19)} | ${q.action} | ${q.status}`);
  }
}

main().finally(() => prisma.$disconnect());
