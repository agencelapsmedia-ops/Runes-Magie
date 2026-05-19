import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import {
  getCloverItemCategoryLinks,
  updateCloverItemCategories,
} from '@/lib/clover';
import { mapSiteToCloverCategoryIds } from '@/lib/clover-sku';
import { isCloverConfigured } from '@/lib/clover-queue';

/**
 * POST /api/admin/clover/relink-categories
 *
 * Rattrapage : pour CHAQUE produit avec un cloverId, vérifie que ses liaisons
 * catégorie côté Clover correspondent bien à sa catégorie côté site, et corrige
 * les manquements.
 *
 * Utile après un changement de logique de mapping (ex: nouveau slug de catégorie
 * qui n'était pas dans la liste hardcodée).
 *
 * Chunks de 5 pour respecter le rate limit Clover.
 * Les opérations qui échouent ne bloquent pas — passent en queue de retry.
 *
 * Body optionnel : { dryRun?: boolean }
 */
const CHUNK_SIZE = 5;

interface RelinkResult {
  productId: string;
  name: string;
  category: string;
  cloverId: string;
  added: string[];
  removed: string[];
  errors: number;
  skipped?: boolean;
  skipReason?: string;
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  if (!isCloverConfigured()) {
    return NextResponse.json({ error: 'Clover non configuré' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  const products = await prisma.product.findMany({
    where: {
      cloverId: { not: null },
      syncToClover: true,
    },
    select: { id: true, name: true, category: true, cloverId: true },
    orderBy: { name: 'asc' },
  });

  const results: RelinkResult[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  let totalUntouched = 0;

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (p): Promise<RelinkResult> => {
        if (!p.cloverId) {
          return { productId: p.id, name: p.name, category: p.category, cloverId: '', added: [], removed: [], errors: 0, skipped: true, skipReason: 'no cloverId' };
        }

        try {
          const expectedIds = await mapSiteToCloverCategoryIds(p.category);
          if (expectedIds.length === 0) {
            return { productId: p.id, name: p.name, category: p.category, cloverId: p.cloverId, added: [], removed: [], errors: 0, skipped: true, skipReason: `pas de cloverCategoryId pour slug '${p.category}'` };
          }

          const actualIds = await getCloverItemCategoryLinks(p.cloverId);

          // Diff
          const toAdd = expectedIds.filter((id) => !actualIds.includes(id));
          const toRemove = actualIds.filter((id) => !expectedIds.includes(id));

          if (toAdd.length === 0 && toRemove.length === 0) {
            return { productId: p.id, name: p.name, category: p.category, cloverId: p.cloverId, added: [], removed: [], errors: 0 };
          }

          if (dryRun) {
            return { productId: p.id, name: p.name, category: p.category, cloverId: p.cloverId, added: toAdd, removed: toRemove, errors: 0 };
          }

          // Apply
          const result = await updateCloverItemCategories(p.cloverId, actualIds, expectedIds);
          await prisma.product.update({
            where: { id: p.id },
            data: { cloverSyncedAt: new Date() },
          });

          return {
            productId: p.id,
            name: p.name,
            category: p.category,
            cloverId: p.cloverId,
            added: result.added,
            removed: result.removed,
            errors: result.errors.length,
          };
        } catch (err) {
          return {
            productId: p.id,
            name: p.name,
            category: p.category,
            cloverId: p.cloverId,
            added: [],
            removed: [],
            errors: 1,
            skipped: true,
            skipReason: err instanceof Error ? err.message.slice(0, 100) : 'erreur',
          };
        }
      }),
    );
    for (const r of chunkResults) {
      results.push(r);
      if (r.skipped) totalSkipped++;
      else if (r.added.length === 0 && r.removed.length === 0) totalUntouched++;
      else {
        totalAdded += r.added.length;
        totalRemoved += r.removed.length;
        totalErrors += r.errors;
      }
    }
  }

  return NextResponse.json({
    dryRun,
    total: products.length,
    untouched: totalUntouched,
    skipped: totalSkipped,
    addedLinks: totalAdded,
    removedLinks: totalRemoved,
    errors: totalErrors,
    samples: results.filter((r) => r.added.length > 0 || r.removed.length > 0 || r.skipped).slice(0, 20),
  });
}
