import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  fetchAllCloverItems,
  normalizeCloverItem,
  type NormalizedCloverProduct,
} from '@/lib/clover';

/**
 * GET /api/cron/clover-pull
 *
 * Cron qui tire l'inventaire Clover vers le site (Clover → site).
 *
 * Appelé par Vercel Cron toutes les 6 heures pour synchroniser :
 *   - stockQuantity (ventes en boutique → décrément du stock site)
 *   - price (si Annabelle change un prix en caisse)
 *   - inStock (item caché/visible)
 *
 * Comportement :
 *   - Ne CRÉE PAS de nouveau produit (filtre POS-only via condition cloverId existe)
 *   - Update seulement les Products déjà liés (matching par cloverId)
 *   - Log dans CloverSyncLog avec triggeredBy='cron'
 *
 * Auth : header X-Cron-Secret matching process.env.CRON_SECRET
 *        OU Vercel cron qui passe Authorization automatique
 */
async function isAuthorized(req: Request): Promise<boolean> {
  // Vercel cron auth (header automatique) OU cron secret manuel
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (cronSecret && cronSecret === process.env.CRON_SECRET) return true;
  return false;
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!process.env.CLOVER_MERCHANT_ID || !process.env.CLOVER_API_TOKEN) {
    return NextResponse.json({ error: 'Clover non configuré' }, { status: 503 });
  }

  const log = await prisma.cloverSyncLog.create({
    data: {
      mode: 'apply',
      triggeredBy: 'cron',
      status: 'RUNNING',
    },
  });

  let itemsFetched = 0;
  let itemsUpdated = 0;
  let itemsSkipped = 0;
  let errorsCount = 0;
  const errors: Array<{ cloverId: string; error: string }> = [];

  try {
    const items = await fetchAllCloverItems();
    itemsFetched = items.length;

    for (const item of items) {
      try {
        const normalized = normalizeCloverItem(item);
        const result = await applyUpdateIfExists(normalized);
        if (result === 'updated') itemsUpdated++;
        else itemsSkipped++;
      } catch (err) {
        errorsCount++;
        errors.push({
          cloverId: item.id,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      }
    }

    await prisma.cloverSyncLog.update({
      where: { id: log.id },
      data: {
        status: errorsCount === 0 ? 'SUCCESS' : itemsUpdated > 0 ? 'PARTIAL' : 'FAILED',
        finishedAt: new Date(),
        itemsFetched,
        itemsUpdated,
        itemsSkipped,
        errorsCount,
        details: errors.length > 0 ? JSON.stringify({ errors: errors.slice(0, 50) }) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      itemsFetched,
      itemsUpdated,
      itemsSkipped,
      errorsCount,
      nextRun: 'dans ~6h',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    await prisma.cloverSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        errorsCount: 1,
        errorMessage: msg.slice(0, 500),
      },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Update les champs sync-back (stock, prix, visibility) si le produit existe
 * déjà côté site (matched par cloverId). NE CRÉE PAS de nouveau produit.
 */
async function applyUpdateIfExists(item: NormalizedCloverProduct): Promise<'updated' | 'skipped'> {
  const existing = await prisma.product.findUnique({
    where: { cloverId: item.cloverId },
    select: { id: true, stockQuantity: true, price: true, inStock: true },
  });

  if (!existing) {
    // Item Clover sans contrepartie site (probablement POS-only).
    // On NE CRÉE PAS pour éviter l'incident du 19 mai (import accidentel).
    return 'skipped';
  }

  // Détecte les changements pour optimiser (skip si rien ne change)
  const stockChanged = existing.stockQuantity !== item.stockQuantity;
  const priceChanged = existing.price !== item.price;
  const stockBoolChanged = existing.inStock !== item.inStock;

  if (!stockChanged && !priceChanged && !stockBoolChanged) {
    return 'skipped';
  }

  await prisma.product.update({
    where: { cloverId: item.cloverId },
    data: {
      stockQuantity: item.stockQuantity,
      price: item.price,
      inStock: item.inStock,
      cloverSyncedAt: new Date(),
    },
  });

  return 'updated';
}
