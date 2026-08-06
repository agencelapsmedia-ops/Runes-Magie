/** Diagnostic ponctuel (lecture seule) : état de la file de sync Clover pour les stocks. */
import { prisma } from '../src/lib/db';

(async () => {
  const parAction = await prisma.cloverSyncQueue.groupBy({
    by: ['action', 'status'],
    _count: { _all: true },
  });
  console.log('--- File Clover par action/statut ---');
  parAction.forEach((r) => console.log(`${r.action} | ${r.status} : ${r._count._all}`));

  const derniers = await prisma.cloverSyncQueue.findMany({
    where: { status: { in: ['FAILED_RETRYING', 'FAILED_MAX_ATTEMPTS', 'PENDING'] } },
    orderBy: { updatedAt: 'desc' },
    take: 4,
    select: { action: true, status: true, attempts: true, lastError: true },
  });
  console.log('\n--- Derniers en échec / en attente ---');
  derniers.forEach((e) =>
    console.log(`${e.action} ${e.status} (${e.attempts}x) : ${(e.lastError ?? '').slice(0, 200)}`),
  );

  const avecStock = await prisma.product.count({
    where: { cloverId: { not: null }, stockQuantity: { not: null } },
  });
  console.log(`\nProduits liés à Clover avec une quantité côté site : ${avecStock}`);
  await prisma.$disconnect();
})();
