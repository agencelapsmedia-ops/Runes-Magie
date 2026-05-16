import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
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
 * Traite les opérations en attente dans CloverSyncQueue.
 *
 * Appelé :
 *   - Manuellement depuis /admin/clover (bouton "Traiter queue maintenant")
 *   - Par Vercel Cron (vercel.json) toutes les 10 minutes
 *
 * Auth :
 *   - Admin session OU header X-Cron-Secret (pour le cron Vercel)
 */
async function isAuthorized(req: Request): Promise<boolean> {
  // 1. Cron Vercel auth
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (cronSecret && cronSecret === process.env.CRON_SECRET) return true;

  // 2. Admin session
  const unauthorized = await requireAdmin();
  return unauthorized === null;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!isCloverConfigured()) {
    return NextResponse.json({ error: 'Clover non configuré (env vars manquantes)' }, { status: 500 });
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

  let succeeded = 0;
  let failed = 0;
  let exhausted = 0;
  const errors: Array<{ id: string; productId: string; action: string; error: string }> = [];

  // Pré-charger les catégories Clover une seule fois (utilisé pour les CREATE)
  let categoriesCache: Array<{ id: string; name: string }> | null = null;
  async function getCategories() {
    if (!categoriesCache) categoriesCache = await fetchAllCloverCategories();
    return categoriesCache;
  }

  for (const item of pending) {
    // Marquer en cours
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
        // Lier le cloverId au Product local
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
      } else {
        throw new Error(`Action inconnue : ${item.action}`);
      }

      // Succès
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

      errors.push({
        id: item.id,
        productId: item.productId,
        action: item.action,
        error: errorMsg.slice(0, 200),
      });
    }
  }

  return NextResponse.json({
    processed: pending.length,
    succeeded,
    failed,
    exhausted,
    errors,
    nextRun: 'dans ~10 min (cron) ou bouton manuel',
  });
}

/**
 * GET — liste la queue actuelle (pour l'affichage admin).
 */
export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const [pending, processing, failed, succeededRecent] = await Promise.all([
    prisma.cloverSyncQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.cloverSyncQueue.findMany({
      where: { status: { in: ['PROCESSING', 'FAILED_RETRYING'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.cloverSyncQueue.findMany({
      where: { status: 'FAILED_MAX_ATTEMPTS' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.cloverSyncQueue.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { succeededAt: 'desc' },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    pending,
    processing,
    failed,
    succeededRecent,
    counts: {
      pending: pending.length,
      processing: processing.length,
      failed: failed.length,
    },
  });
}
