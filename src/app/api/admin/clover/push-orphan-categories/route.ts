import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { tryCreateCategoryInClover, isCloverConfigured } from '@/lib/clover-queue';

/**
 * POST /api/admin/clover/push-orphan-categories
 *
 * Rattrapage : pousse vers Clover toutes les Category qui n'ont pas de
 * cloverCategoryId (orphelines du sync immédiat).
 *
 * Query params optionnels :
 *   - ?limit=N : ne traite que les N premières (utile pour tester avec 1)
 *
 * Analogue à /api/admin/clover/push-orphans (qui pousse les Product).
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

  const orphans = await prisma.category.findMany({
    where: { cloverCategoryId: null },
    select: {
      id: true,
      slug: true,
      name: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  const results: Array<{
    categoryId: string;
    name: string;
    status: 'synced' | 'queued';
    cloverCategoryId?: string;
  }> = [];

  for (const c of orphans) {
    const cloverCategoryId = await tryCreateCategoryInClover({
      categoryId: c.id,
      name: c.name,
      sortOrder: c.displayOrder,
    });
    results.push({
      categoryId: c.id,
      name: c.name,
      status: cloverCategoryId ? 'synced' : 'queued',
      cloverCategoryId: cloverCategoryId ?? undefined,
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
