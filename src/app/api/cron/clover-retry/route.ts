import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  createCloverItem,
  updateCloverItem,
  deleteCloverItem,
  setCloverItemStock,
  fetchAllCloverCategories,
} from '@/lib/clover';
import { mapSiteToCloverCategoryIds } from '@/lib/clover-sku';
import { nextBackoffMs, isCloverConfigured } from '@/lib/clover-queue';

/**
 * GET /api/cron/clover-retry
 *
 * Endpoint appelé automatiquement par Vercel Cron (configuré dans vercel.json) toutes les 10 min.
 * Authentifié via header Authorization: Bearer ${CRON_SECRET}.
 *
 * Traite jusqu'à 20 items de la queue par exécution (backoff exponential).
 */
export async function GET(req: Request) {
  // Auth : Vercel Cron envoie automatiquement Authorization: Bearer ${CRON_SECRET}
  const auth = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!isCloverConfigured()) {
    return NextResponse.json({ skipped: true, reason: 'Clover non configuré' });
  }

  const now = new Date();
  const batchSize = 20;

  const pending = await prisma.cloverSyncQueue.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED_RETRYING'] },
      nextAttemptAt: { lte: now },
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: batchSize,
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, message: 'Aucun item à traiter' });
  }

  let succeeded = 0;
  let failed = 0;
  let exhausted = 0;

  let categoriesCache: Array<{ id: string; name: string }> | null = null;
  async function getCategories() {
    if (!categoriesCache) categoriesCache = await fetchAllCloverCategories();
    return categoriesCache;
  }

  for (const item of pending) {
    await prisma.cloverSyncQueue.update({
      where: { id: item.id },
      data: { status: 'PROCESSING', lastAttemptAt: now, attempts: item.attempts + 1 },
    });

    try {
      const payload = JSON.parse(item.payload);

      if (item.action === 'CREATE') {
        const categories = await getCategories();
        const categoryIds = mapSiteToCloverCategoryIds(payload.category, categories);
        const created = await createCloverItem({
          name: payload.name,
          priceCents: payload.priceCents,
          sku: payload.sku,
          alternateName: payload.description,
          hidden: payload.hidden ?? false,
          categoryIds,
        });
        await prisma.product.update({
          where: { id: item.productId },
          data: { cloverId: created.id, cloverSyncedAt: new Date() },
        });
      } else if (item.action === 'UPDATE') {
        await updateCloverItem(payload.cloverId, payload.data);
        await prisma.product.update({
          where: { id: item.productId },
          data: { cloverSyncedAt: new Date() },
        });
      } else if (item.action === 'DELETE') {
        await deleteCloverItem(payload.cloverId);
      } else if (item.action === 'STOCK_SET') {
        await setCloverItemStock(payload.cloverId, payload.stockCount);
      }

      await prisma.cloverSyncQueue.update({
        where: { id: item.id },
        data: { status: 'SUCCESS', succeededAt: new Date(), lastError: null },
      });
      succeeded++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      const newAttempts = item.attempts + 1;
      const isExhausted = newAttempts >= item.maxAttempts;

      await prisma.cloverSyncQueue.update({
        where: { id: item.id },
        data: {
          status: isExhausted ? 'FAILED_MAX_ATTEMPTS' : 'FAILED_RETRYING',
          lastError: errorMsg.slice(0, 500),
          nextAttemptAt: isExhausted ? item.nextAttemptAt : new Date(Date.now() + nextBackoffMs(newAttempts)),
        },
      });

      if (isExhausted) exhausted++;
      else failed++;
    }
  }

  return NextResponse.json({
    processed: pending.length,
    succeeded,
    failed,
    exhausted,
    timestamp: new Date().toISOString(),
  });
}
