import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import {
  fetchAllCloverItems,
  normalizeCloverItem,
  NormalizedCloverProduct,
} from '@/lib/clover';

interface SyncResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  mode: 'dry-run' | 'apply';
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errorsCount: number;
  errors: Array<{ cloverId: string; name: string; reason: string }>;
  preview?: Array<{
    action: 'create' | 'update' | 'skip';
    cloverId: string;
    name: string;
    matchedBy?: 'cloverId' | 'sku' | 'slug';
    changes?: Record<string, { from: unknown; to: unknown }>;
  }>;
}

/**
 * POST /api/admin/clover/sync
 *
 * Body (JSON optionnel) :
 *   { mode: "dry-run" | "apply" }   // défaut: dry-run
 *
 * Synchronise l'inventaire Clover vers la table Product.
 * Matching prioritaire :
 *   1. cloverId (exact)
 *   2. sku (exact, si présent)
 *   3. slug (exact, fallback)
 */
export async function POST(req: Request) {
  // Authentification admin
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const mode: 'dry-run' | 'apply' = body.mode === 'apply' ? 'apply' : 'dry-run';

  // Créer un log de sync (statut RUNNING)
  const log = await prisma.cloverSyncLog.create({
    data: {
      mode,
      triggeredBy: 'manual',
      status: 'RUNNING',
    },
  });

  const result: SyncResult = {
    status: 'SUCCESS',
    mode,
    itemsFetched: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errorsCount: 0,
    errors: [],
    preview: mode === 'dry-run' ? [] : undefined,
  };

  try {
    const items = await fetchAllCloverItems();
    result.itemsFetched = items.length;

    for (const item of items) {
      try {
        const normalized = normalizeCloverItem(item);
        const matchResult = await applySyncItem(normalized, mode);

        if (matchResult.action === 'create') result.itemsCreated++;
        else if (matchResult.action === 'update') result.itemsUpdated++;
        else result.itemsSkipped++;

        if (mode === 'dry-run' && result.preview) {
          result.preview.push({
            action: matchResult.action,
            cloverId: normalized.cloverId,
            name: normalized.name,
            matchedBy: matchResult.matchedBy,
            changes: matchResult.changes,
          });
        }
      } catch (err) {
        result.errorsCount++;
        result.errors.push({
          cloverId: item.id,
          name: item.name,
          reason: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      }
    }

    if (result.errorsCount > 0 && result.itemsCreated + result.itemsUpdated > 0) {
      result.status = 'PARTIAL';
    } else if (result.errorsCount > 0) {
      result.status = 'FAILED';
    }
  } catch (err) {
    result.status = 'FAILED';
    result.errorsCount++;
    result.errors.push({
      cloverId: '—',
      name: '—',
      reason: err instanceof Error ? err.message : 'Erreur réseau Clover',
    });

    await prisma.cloverSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        errorsCount: 1,
        errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
      },
    });

    return NextResponse.json({ error: result.errors[0]?.reason, log: log.id }, { status: 500 });
  }

  // Mise à jour finale du log
  await prisma.cloverSyncLog.update({
    where: { id: log.id },
    data: {
      status: result.status,
      finishedAt: new Date(),
      itemsFetched: result.itemsFetched,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsSkipped: result.itemsSkipped,
      errorsCount: result.errorsCount,
      details: result.errors.length > 0 ? JSON.stringify({ errors: result.errors }) : null,
    },
  });

  return NextResponse.json({ ...result, logId: log.id });
}

// ════════════════════════════════════════════════════════════════
// Mapping logique : applique un item normalisé sur la DB
// ════════════════════════════════════════════════════════════════

interface ApplyResult {
  action: 'create' | 'update' | 'skip';
  matchedBy?: 'cloverId' | 'sku' | 'slug';
  changes?: Record<string, { from: unknown; to: unknown }>;
}

async function applySyncItem(
  item: NormalizedCloverProduct,
  mode: 'dry-run' | 'apply',
): Promise<ApplyResult> {
  // 1. Cherche par cloverId (le plus fiable)
  let existing = await prisma.product.findUnique({ where: { cloverId: item.cloverId } });
  let matchedBy: 'cloverId' | 'sku' | 'slug' | undefined;

  if (existing) {
    matchedBy = 'cloverId';
  } else if (item.sku) {
    // 2. Cherche par SKU
    existing = await prisma.product.findFirst({ where: { sku: item.sku } });
    if (existing) matchedBy = 'sku';
  }

  if (!existing) {
    // 3. Fallback : cherche par slug
    existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (existing) matchedBy = 'slug';
  }

  if (!existing) {
    // CREATE
    if (mode === 'apply') {
      await prisma.product.create({
        data: {
          cloverId: item.cloverId,
          sku: item.sku,
          slug: item.slug,
          name: item.name,
          price: item.price,
          description: item.description,
          category: item.category,
          image: '', // pas d'image Clover par défaut
          inStock: item.inStock,
          stockQuantity: item.stockQuantity,
          cloverSyncedAt: new Date(),
        },
      });
    }
    return { action: 'create' };
  }

  // UPDATE — détermine ce qui change
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (existing.price !== item.price) changes.price = { from: existing.price, to: item.price };
  if (existing.name !== item.name) changes.name = { from: existing.name, to: item.name };
  if (existing.inStock !== item.inStock) changes.inStock = { from: existing.inStock, to: item.inStock };
  if (existing.stockQuantity !== item.stockQuantity)
    changes.stockQuantity = { from: existing.stockQuantity, to: item.stockQuantity };
  if (existing.category !== item.category && !existing.category)
    changes.category = { from: existing.category, to: item.category };

  const hasChanges = Object.keys(changes).length > 0;

  if (!hasChanges && existing.cloverId === item.cloverId) {
    return { action: 'skip', matchedBy };
  }

  if (mode === 'apply') {
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        cloverId: item.cloverId,
        sku: item.sku ?? existing.sku,
        price: item.price,
        name: item.name,
        inStock: item.inStock,
        stockQuantity: item.stockQuantity,
        // NB : on ne touche pas à description, image, category, featured si déjà custom
        cloverSyncedAt: new Date(),
      },
    });
  }

  return { action: hasChanges ? 'update' : 'skip', matchedBy, changes };
}
