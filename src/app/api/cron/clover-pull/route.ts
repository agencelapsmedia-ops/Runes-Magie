import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchCloverOrdersSince, type CloverLineItem } from '@/lib/clover';

/**
 * GET /api/cron/clover-pull
 *
 * Cron qui décrémente le stock site SELON LES VENTES Clover récentes.
 *
 * ⚠️ ARCHITECTURE : le site est MAÎTRE de l'inventaire. Clover ne sert que
 * de caisse pour décrémenter quand une vente est faite. On NE PULL PAS l'état
 * complet des items Clover (ça écraserait les stocks gérés côté site).
 *
 * Au lieu de ça, on récupère les NOUVELLES ORDERS Clover depuis le dernier
 * check, et on décrémente Product.stockQuantity pour chaque item vendu.
 *
 * Stocke le timestamp du dernier check dans BookingSetting (clé
 * `clover_last_orders_check`) pour ne pas double-décrémenter.
 *
 * Cron : toutes les 6h (vercel.json)
 * Auth : header X-Cron-Secret matching process.env.CRON_SECRET
 */

const SETTING_KEY = 'clover_last_orders_check';
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000; // 24h sur le premier run

async function isAuthorized(req: Request): Promise<boolean> {
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return !!cronSecret && cronSecret === process.env.CRON_SECRET;
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

  let ordersFetched = 0;
  let lineItemsProcessed = 0;
  let decrementedCount = 0;
  let skippedNoMatch = 0;
  let skippedRefunded = 0;
  let errorsCount = 0;
  const errors: Array<{ orderId: string; error: string }> = [];

  try {
    // 1) Lire le timestamp du dernier check (ou défaut -24h sur 1er run)
    const setting = await prisma.bookingSetting.findUnique({ where: { key: SETTING_KEY } });
    const sinceMs = setting ? parseInt(setting.value, 10) : Date.now() - DEFAULT_LOOKBACK_MS;

    // 2) Fetch les orders Clover depuis ce timestamp
    const orders = await fetchCloverOrdersSince(sinceMs);
    ordersFetched = orders.length;

    // 3) Pour chaque order, décrémenter le stock site
    const nowMs = Date.now();
    for (const order of orders) {
      try {
        // On ne traite que les orders effectivement payées (skip "open", "locked", etc.)
        // Clover utilise 'paid' pour les ventes confirmées.
        if (order.state && order.state !== 'paid') continue;

        const items = order.lineItems?.elements ?? [];
        for (const li of items) {
          lineItemsProcessed++;

          if (li.refunded || li.exchanged) {
            skippedRefunded++;
            continue;
          }

          const cloverItemId = li.item?.id;
          if (!cloverItemId) {
            skippedNoMatch++;
            continue;
          }

          const qty = getLineItemQuantity(li);
          if (qty <= 0) {
            skippedNoMatch++;
            continue;
          }

          // Décrémenter le Product correspondant si il a stockQuantity non-null
          // (les ebooks/cours/dropship sont skip naturellement)
          const result = await prisma.product.updateMany({
            where: {
              cloverId: cloverItemId,
              stockQuantity: { not: null },
            },
            data: {
              stockQuantity: { decrement: qty },
              cloverSyncedAt: new Date(),
            },
          });

          if (result.count > 0) {
            decrementedCount += result.count;
          } else {
            skippedNoMatch++;
          }
        }
      } catch (err) {
        errorsCount++;
        errors.push({
          orderId: order.id,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      }
    }

    // 4) Sauver le nouveau timestamp de check
    await prisma.bookingSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(nowMs) },
      create: { key: SETTING_KEY, value: String(nowMs) },
    });

    // 5) Finaliser le log
    const status = errorsCount === 0 ? 'SUCCESS' : decrementedCount > 0 ? 'PARTIAL' : 'FAILED';
    await prisma.cloverSyncLog.update({
      where: { id: log.id },
      data: {
        status,
        finishedAt: new Date(),
        itemsFetched: ordersFetched,
        itemsUpdated: decrementedCount,
        itemsSkipped: skippedNoMatch + skippedRefunded,
        errorsCount,
        details: errors.length > 0 ? JSON.stringify({ errors: errors.slice(0, 50) }) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      sinceMs,
      nowMs,
      ordersFetched,
      lineItemsProcessed,
      decrementedCount,
      skippedNoMatch,
      skippedRefunded,
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
 * Clover peut renvoyer la quantité d'un line item via :
 *   - `unitQty` (centiéme, ex 1000 = 1.0 pour items à poids variable)
 *   - `quantity` (entier direct pour items normaux)
 * Selon le type d'item. On normalise en entier ≥ 1.
 */
function getLineItemQuantity(li: CloverLineItem): number {
  if (typeof li.quantity === 'number' && li.quantity > 0) return li.quantity;
  if (typeof li.unitQty === 'number' && li.unitQty > 0) {
    // unitQty est en centièmes pour les items à poids ; mais pour les items
    // entiers, c'est généralement 1000, 2000, etc. → diviser par 1000.
    return Math.max(1, Math.round(li.unitQty / 1000));
  }
  return 1; // défaut : 1 unité par line item
}
