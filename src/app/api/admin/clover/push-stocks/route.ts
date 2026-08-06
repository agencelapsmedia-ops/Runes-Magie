import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { trySetStockInClover, isCloverConfigured } from '@/lib/clover-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/clover/push-stocks
 *
 * Envoie vers Clover la quantité en stock des produits qui y sont déjà présents.
 *
 * Pourquoi cette route existe : chez Clover, le stock vit sur un endpoint
 * distinct de l'article (`/item_stocks`). Créer un article ne transmet donc
 * jamais sa quantité. Les produits poussés avant la correction sont arrivés
 * sans inventaire ; celle-ci permet de les compléter.
 *
 * Réutilisable : à chaque fois qu'une partie de l'inventaire est mise en ordre
 * sur le site, ce bouton reporte les quantités dans Clover.
 *
 * Paramètres optionnels :
 *   - ?limit=N       : ne traite que les N premiers (tester avec 1)
 *   - ?depuis=DATE   : seulement les produits créés depuis cette date ISO
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
  const depuisParam = url.searchParams.get('depuis');
  const depuis = depuisParam ? new Date(depuisParam) : null;
  if (depuis && Number.isNaN(depuis.getTime())) {
    return NextResponse.json({ error: 'Paramètre `depuis` invalide.' }, { status: 400 });
  }

  const produits = await prisma.product.findMany({
    where: {
      cloverId: { not: null },
      stockQuantity: { not: null },
      ...(depuis ? { createdAt: { gte: depuis } } : {}),
    },
    select: { id: true, name: true, cloverId: true, stockQuantity: true },
    orderBy: { createdAt: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  const resultats: Array<{ name: string; stock: number; status: 'envoye' | 'en-file' }> = [];
  for (const p of produits) {
    const ok = await trySetStockInClover(p.id, p.cloverId as string, p.stockQuantity as number);
    resultats.push({
      name: p.name,
      stock: p.stockQuantity as number,
      status: ok ? 'envoye' : 'en-file',
    });
  }

  const envoyes = resultats.filter((r) => r.status === 'envoye').length;
  const unitesTotal = resultats
    .filter((r) => r.status === 'envoye')
    .reduce((somme, r) => somme + r.stock, 0);

  return NextResponse.json({
    total: produits.length,
    envoyes,
    enFile: resultats.length - envoyes,
    unitesTotal,
    resultats,
  });
}
