import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { tryCreateInClover, isCloverConfigured } from '@/lib/clover-queue';

/**
 * POST /api/admin/clover/push-orphans
 *
 * Rattrapage : pousse vers Clover tous les produits qui ont `syncToClover=true`
 * mais pas de `cloverId` (orphelins du sync immédiat).
 *
 * Query params optionnels :
 *   - ?limit=N  : ne traite que les N premiers (utile pour tester avec 1)
 *
 * Utile après une remise en place des credentials Clover, ou après import en masse.
 */
export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  if (!isCloverConfigured()) {
    return NextResponse.json(
      { error: 'Clover non configuré (CLOVER_MERCHANT_ID ou CLOVER_API_TOKEN manquant)' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(500, parseInt(limitParam, 10) || 0)) : undefined;

  const orphans = await prisma.product.findMany({
    where: { syncToClover: true, cloverId: null },
    select: {
      id: true,
      name: true,
      price: true,
      sku: true,
      category: true,
      description: true,
    },
    orderBy: { createdAt: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  const results: Array<{
    productId: string;
    name: string;
    status: 'synced' | 'queued';
    cloverId?: string;
  }> = [];

  for (const p of orphans) {
    const cloverId = await tryCreateInClover({
      productId: p.id,
      name: p.name,
      priceCents: Math.round(p.price * 100),
      sku: p.sku,
      category: p.category,
      description: p.description,
    });
    results.push({
      productId: p.id,
      name: p.name,
      status: cloverId ? 'synced' : 'queued',
      cloverId: cloverId ?? undefined,
    });
  }

  const synced = results.filter((r) => r.status === 'synced').length;
  const queued = results.filter((r) => r.status === 'queued').length;

  return NextResponse.json({
    totalOrphans: orphans.length,
    synced,
    queued,
    results,
  });
}
