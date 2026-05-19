import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getCloverItem, normalizeCloverItem } from '@/lib/clover';

/**
 * Webhook Clover → site.
 *
 * Reçoit les notifications de Clover quand un item change (vente en boutique,
 * modification manuelle, etc.) et met à jour le Product correspondant côté site.
 *
 * Configuration côté Clover :
 *   1. Dashboard → Setup → Webhooks → Add Webhook
 *   2. URL : https://www.runesetmagie.ca/api/webhooks/clover
 *   3. Events : Inventory (item updates)
 *   4. Save → copier le webhook secret → l'ajouter à Vercel comme
 *      CLOVER_WEBHOOK_SECRET (Sensitive)
 *
 * Vérification :
 *   - GET ?verificationCode=... : Clover envoie pour confirmer le endpoint à la config initiale
 *   - POST : notifications réelles, signature HMAC-SHA256 vérifiée
 */

interface CloverWebhookEvent {
  objectId: string; // "I:ITEM_ID" — préfixe par type d'objet
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  ts: number;
}

interface CloverWebhookPayload {
  appId?: string;
  merchants: Record<string, CloverWebhookEvent[]>;
}

/**
 * Vérification initiale du webhook par Clover.
 * Clover envoie un GET avec ?verificationCode=... pour vérifier que le endpoint
 * est joignable. On doit répondre 200 avec le code dans le body (selon la doc).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const verificationCode = url.searchParams.get('verificationCode');

  if (verificationCode) {
    console.log('[webhook/clover] Vérification initiale Clover reçue', { verificationCode });
    return new NextResponse(verificationCode, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ status: 'ok', message: 'Clover webhook endpoint actif' });
}

/**
 * Reçoit les notifications Clover et met à jour les Products du site.
 */
export async function POST(req: Request) {
  const bodyText = await req.text();
  const secret = process.env.CLOVER_WEBHOOK_SECRET;

  // Vérification de la signature HMAC-SHA256
  // Clover envoie le header X-Clover-Auth-Signature (hex digest)
  if (secret) {
    const receivedSig = req.headers.get('x-clover-auth-signature');
    if (!receivedSig) {
      console.warn('[webhook/clover] Signature manquante');
      return NextResponse.json({ error: 'Signature manquante' }, { status: 401 });
    }
    const expectedSig = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');
    if (receivedSig !== expectedSig) {
      console.warn('[webhook/clover] Signature invalide');
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }
  } else {
    console.warn('[webhook/clover] CLOVER_WEBHOOK_SECRET non configuré — signature non vérifiée');
  }

  let payload: CloverWebhookPayload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const startedAt = new Date();
  const log = await prisma.cloverSyncLog.create({
    data: {
      mode: 'apply',
      triggeredBy: 'webhook',
      status: 'RUNNING',
    },
  });

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    for (const [merchantId, events] of Object.entries(payload.merchants || {})) {
      for (const event of events) {
        processed++;
        try {
          // objectId format : "TYPE:ID" (ex: "I:ITEM_ID", "C:CATEGORY_ID")
          // On ne traite que les items (préfixe I:)
          if (!event.objectId.startsWith('I:')) {
            skipped++;
            continue;
          }

          const cloverId = event.objectId.slice(2);

          if (event.type === 'DELETE') {
            // Item supprimé dans Clover : on cache le produit local (pas supprimer
            // pour préserver l'historique commandes)
            const existing = await prisma.product.findUnique({ where: { cloverId } });
            if (existing) {
              await prisma.product.update({
                where: { cloverId },
                data: { inStock: false, cloverSyncedAt: new Date(event.ts) },
              });
              updated++;
            } else {
              skipped++;
            }
            continue;
          }

          // CREATE ou UPDATE : fetcher l'item Clover pour avoir les détails
          const item = await getCloverItem(cloverId);
          const normalized = normalizeCloverItem(item);

          const existing = await prisma.product.findUnique({ where: { cloverId } });

          // Idempotence : si on a déjà sync après ce ts, on skip
          if (existing?.cloverSyncedAt && existing.cloverSyncedAt.getTime() >= event.ts) {
            skipped++;
            continue;
          }

          if (!existing) {
            // Item Clover sans contrepartie sur le site
            // On ne crée PAS automatiquement (sinon on importerait tous les
            // items POS-only, comme dans l'incident du 19 mai). On log juste.
            skipped++;
            continue;
          }

          // UPDATE : on touche uniquement stock + prix + inStock
          // (le reste est géré par l'admin via l'interface site)
          await prisma.product.update({
            where: { cloverId },
            data: {
              stockQuantity: normalized.stockQuantity,
              price: normalized.price,
              inStock: normalized.inStock,
              cloverSyncedAt: new Date(event.ts),
            },
          });
          updated++;
        } catch (err) {
          errors++;
          const msg = err instanceof Error ? err.message : 'Erreur inconnue';
          errorMessages.push(`${event.objectId} : ${msg.slice(0, 100)}`);
          console.error('[webhook/clover] Event échec', { merchantId, event, err });
        }
      }
    }

    await prisma.cloverSyncLog.update({
      where: { id: log.id },
      data: {
        status: errors === 0 ? 'SUCCESS' : updated > 0 ? 'PARTIAL' : 'FAILED',
        finishedAt: new Date(),
        itemsFetched: processed,
        itemsUpdated: updated,
        itemsSkipped: skipped,
        errorsCount: errors,
        details: errorMessages.length > 0 ? JSON.stringify({ errors: errorMessages }) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      processed,
      updated,
      skipped,
      errors,
      durationMs: Date.now() - startedAt.getTime(),
      logId: log.id,
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
