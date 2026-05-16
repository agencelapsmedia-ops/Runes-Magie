/**
 * Queue de retry pour les opérations Clover qui ont échoué.
 *
 * Stratégie : try-then-queue
 *   1. Tente l'opération immédiatement
 *   2. Si succès : retourne le résultat
 *   3. Si échec : ajoute à CloverSyncQueue pour retry plus tard
 *
 * Le cron Vercel (/api/admin/clover/retry-queue) traite la queue avec backoff exponential.
 */

import { prisma } from '@/lib/db';
import {
  createCloverItem,
  updateCloverItem,
  deleteCloverItem,
  fetchAllCloverCategories,
  type CreateCloverItemInput,
  type UpdateCloverItemInput,
} from '@/lib/clover';
import { mapSiteToCloverCategoryIds } from '@/lib/clover-sku';

export type CloverQueueAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_SET';

interface CreatePayload {
  productId: string;
  name: string;
  priceCents: number;
  sku?: string | null;
  category: string;
  description?: string;
  hidden?: boolean;
}

interface UpdatePayload {
  cloverId: string;
  data: UpdateCloverItemInput;
}

interface DeletePayload {
  cloverId: string;
}

interface StockSetPayload {
  cloverId: string;
  stockCount: number;
}

/**
 * Ajoute une opération dans la queue de retry.
 */
export async function queueOperation(
  action: CloverQueueAction,
  productId: string,
  payload: object,
  error?: unknown,
): Promise<void> {
  const errorMsg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : null;

  // Backoff exponential : 1min, 5min, 15min, 1h, 6h
  const nextAttemptAt = new Date(Date.now() + 60_000); // 1 minute

  await prisma.cloverSyncQueue.create({
    data: {
      productId,
      action,
      payload: JSON.stringify(payload),
      status: 'PENDING',
      attempts: 0,
      lastError: errorMsg,
      nextAttemptAt,
    },
  });
}

/**
 * Tente la création immédiate dans Clover. Si échec → queue + log.
 * Retourne le cloverId si succès, null sinon (mais le produit reste créé localement).
 */
export async function tryCreateInClover(payload: CreatePayload): Promise<string | null> {
  try {
    const categories = await fetchAllCloverCategories();
    const categoryIds = mapSiteToCloverCategoryIds(payload.category, categories);

    const input: CreateCloverItemInput = {
      name: payload.name,
      priceCents: payload.priceCents,
      sku: payload.sku,
      alternateName: payload.description,
      hidden: payload.hidden ?? false,
      categoryIds,
    };

    const created = await createCloverItem(input);

    // Update le Product avec le cloverId reçu
    await prisma.product.update({
      where: { id: payload.productId },
      data: { cloverId: created.id, cloverSyncedAt: new Date() },
    });

    return created.id;
  } catch (err) {
    console.error('[clover-queue] CREATE échouée → mise en queue', { productId: payload.productId, err });
    await queueOperation('CREATE', payload.productId, payload, err);
    return null;
  }
}

/**
 * Tente l'update immédiate dans Clover. Si échec → queue.
 */
export async function tryUpdateInClover(productId: string, payload: UpdatePayload): Promise<boolean> {
  try {
    await updateCloverItem(payload.cloverId, payload.data);
    await prisma.product.update({
      where: { id: productId },
      data: { cloverSyncedAt: new Date() },
    });
    return true;
  } catch (err) {
    console.error('[clover-queue] UPDATE échouée → mise en queue', { productId, err });
    await queueOperation('UPDATE', productId, payload, err);
    return false;
  }
}

/**
 * Tente le delete immédiat dans Clover. Si échec → queue.
 * NB: même si Clover refuse, le produit est déjà supprimé du site.
 */
export async function tryDeleteInClover(productId: string, payload: DeletePayload): Promise<boolean> {
  try {
    await deleteCloverItem(payload.cloverId);
    return true;
  } catch (err) {
    console.error('[clover-queue] DELETE échouée → mise en queue', { productId, err });
    await queueOperation('DELETE', productId, payload, err);
    return false;
  }
}

/**
 * Vérifie si la config Clover est disponible (vars d'env présentes).
 * Si non, on ne tente même pas l'opération — le sync sera fait plus tard manuellement.
 */
export function isCloverConfigured(): boolean {
  return Boolean(process.env.CLOVER_MERCHANT_ID && process.env.CLOVER_API_TOKEN);
}

/**
 * Calcule le prochain délai de retry selon le nombre de tentatives.
 * Backoff exponential : 1min, 5min, 15min, 1h, 6h.
 */
export function nextBackoffMs(attempts: number): number {
  const delays = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];
  return delays[Math.min(attempts, delays.length - 1)];
}
