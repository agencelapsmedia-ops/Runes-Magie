import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { tryUpdateInClover, isCloverConfigured } from "@/lib/clover-queue";
import { setCloverItemStock } from "@/lib/clover";

/**
 * POST /api/admin/products/bulk-update
 *
 * Met à jour plusieurs produits d'un coup. Utilisé par la grille spreadsheet
 * (/admin/produits/grid).
 *
 * Body : { updates: Array<{ id: string, changes: Partial<Product> }> }
 *
 * Traitement par chunks de 5 en parallèle pour respecter le rate-limit Clover
 * (16 req/s/merchant) en laissant de la marge. Les écritures Prisma sont
 * indépendantes ; les sync Clover qui échouent passent par la queue de retry.
 *
 * Réponse :
 *   {
 *     results: Array<{
 *       id, ok: boolean, error?: string,
 *       cloverSyncStatus: 'synced' | 'queued' | 'skipped'
 *     }>,
 *     counts: { ok, failed, syncedClover, queuedClover }
 *   }
 */

interface UpdateInput {
  id: string;
  changes: Record<string, unknown>;
}

interface UpdateResult {
  id: string;
  ok: boolean;
  error?: string;
  cloverSyncStatus: 'synced' | 'queued' | 'skipped';
}

// Liste blanche des champs modifiables via bulk-update
const ALLOWED_FIELDS = new Set([
  'name', 'price', 'description', 'longDescription',
  'category', 'subcategory', 'stone', 'author', 'content', 'format',
  'checkoutType', 'image', 'inStock', 'featured', 'tags', 'sku',
  'stockQuantity', 'productType', 'syncToClover',
]);

const CHUNK_SIZE = 5; // Concurrence max pour les writes Clover

async function processOne(input: UpdateInput, cloverEnabled: boolean): Promise<UpdateResult> {
  try {
    // Filtre les champs interdits
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(input.changes)) {
      if (ALLOWED_FIELDS.has(key)) {
        filtered[key] = input.changes[key];
      }
    }

    // Normalisations
    if (typeof filtered.price === 'string') filtered.price = parseFloat(filtered.price as string);
    if (typeof filtered.stockQuantity === 'string') {
      filtered.stockQuantity = filtered.stockQuantity ? parseInt(filtered.stockQuantity as string, 10) : null;
    }
    if (filtered.subcategory === '') filtered.subcategory = null;
    if (filtered.stone === '') filtered.stone = null;
    if (filtered.author === '') filtered.author = null;
    if (filtered.content === '') filtered.content = null;
    if (filtered.format === '') filtered.format = null;
    if (filtered.sku === '') filtered.sku = null;

    // Si nom change → maj du slug
    if (typeof filtered.name === 'string' && filtered.name.trim()) {
      filtered.slug = slugify(filtered.name as string);
    }

    const product = await prisma.product.update({
      where: { id: input.id },
      data: filtered,
    });

    // Propagation Clover
    let cloverSyncStatus: 'synced' | 'queued' | 'skipped' = 'skipped';
    if (cloverEnabled && product.cloverId && product.syncToClover) {
      const cloverUpdate: {
        name?: string;
        priceCents?: number;
        sku?: string | null;
        alternateName?: string;
        hidden?: boolean;
      } = {};
      if (filtered.name !== undefined) cloverUpdate.name = product.name;
      if (filtered.price !== undefined) cloverUpdate.priceCents = Math.round(product.price * 100);
      if (filtered.sku !== undefined) cloverUpdate.sku = product.sku;
      if (filtered.description !== undefined) cloverUpdate.alternateName = product.description;
      if (filtered.inStock !== undefined) cloverUpdate.hidden = !product.inStock;

      if (Object.keys(cloverUpdate).length > 0) {
        const ok = await tryUpdateInClover(input.id, { cloverId: product.cloverId, data: cloverUpdate });
        cloverSyncStatus = ok ? 'synced' : 'queued';
      }

      // Stock séparé (endpoint dédié dans Clover)
      if (filtered.stockQuantity !== undefined && product.stockQuantity != null) {
        try {
          await setCloverItemStock(product.cloverId, product.stockQuantity);
          if (cloverSyncStatus === 'skipped') cloverSyncStatus = 'synced';
        } catch (err) {
          console.error('[bulk-update] setCloverItemStock échec', { productId: input.id, err });
          cloverSyncStatus = 'queued';
        }
      }
    }

    return { id: input.id, ok: true, cloverSyncStatus };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
    return { id: input.id, ok: false, error: errorMsg, cloverSyncStatus: 'skipped' };
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const updates: UpdateInput[] = Array.isArray(body.updates) ? body.updates : [];

    if (updates.length === 0) {
      return NextResponse.json({ error: "Le tableau updates est requis et ne peut pas être vide" }, { status: 400 });
    }
    if (updates.length > 500) {
      return NextResponse.json({ error: "Maximum 500 produits par batch" }, { status: 400 });
    }

    const cloverEnabled = isCloverConfigured();
    const results: UpdateResult[] = [];

    // Traite par chunks pour éviter de surcharger Clover
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(chunk.map((u) => processOne(u, cloverEnabled)));
      results.push(...chunkResults);
    }

    const counts = {
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      syncedClover: results.filter((r) => r.cloverSyncStatus === 'synced').length,
      queuedClover: results.filter((r) => r.cloverSyncStatus === 'queued').length,
    };

    return NextResponse.json({ results, counts });
  } catch (error) {
    console.error("Error in bulk-update:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
