import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { updateCloverItem } from '@/lib/clover';
import { isCloverConfigured } from '@/lib/clover-queue';

/**
 * POST /api/admin/clover/push-all-skus
 *
 * Pousse vers Clover le SKU de TOUS les produits qui ont un cloverId.
 * Utile après une migration de SKU (ex: regenerate-skus.ts) où le script
 * a updaté la DB mais pas pu pousser à Clover (vars Sensitive non pullables).
 *
 * Chunks de 5 en parallèle pour respecter le rate limit Clover (16 req/s).
 * Les échecs partent en queue de retry classique.
 *
 * Body (optionnel) : { dryRun?: boolean } pour voir ce qui changerait sans push.
 */
const CHUNK_SIZE = 5;

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
      sku: { not: null },
      syncToClover: true,
    },
    select: { id: true, name: true, cloverId: true, sku: true },
    orderBy: { sku: 'asc' },
  });

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      count: products.length,
      sample: products.slice(0, 20).map((p) => ({ name: p.name, sku: p.sku, cloverId: p.cloverId })),
    });
  }

  let pushOk = 0;
  let pushFail = 0;
  const errors: Array<{ productId: string; sku: string; error: string }> = [];

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (p) => {
        if (!p.cloverId || !p.sku) return;
        try {
          await updateCloverItem(p.cloverId, { sku: p.sku });
          await prisma.product.update({
            where: { id: p.id },
            data: { cloverSyncedAt: new Date() },
          });
          pushOk++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue';
          pushFail++;
          errors.push({ productId: p.id, sku: p.sku, error: msg.slice(0, 200) });
          // Mise en queue pour retry
          await prisma.cloverSyncQueue.create({
            data: {
              productId: p.id,
              action: 'UPDATE',
              payload: JSON.stringify({ cloverId: p.cloverId, data: { sku: p.sku } }),
              status: 'PENDING',
              attempts: 0,
              lastError: msg.slice(0, 500),
              nextAttemptAt: new Date(Date.now() + 60_000),
            },
          });
        }
      }),
    );
  }

  return NextResponse.json({
    total: products.length,
    pushOk,
    pushFail,
    errors: errors.slice(0, 20),
  });
}
