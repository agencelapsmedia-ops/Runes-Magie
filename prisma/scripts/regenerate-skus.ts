/**
 * Migration SKU : réassigne des SKU séquentiels 4 chiffres (0001, 0002, ...)
 * à tous les Product existants, par ordre de createdAt ASC.
 *
 * Usage :
 *   npx tsx prisma/scripts/regenerate-skus.ts            # dry-run (n'écrit rien)
 *   npx tsx prisma/scripts/regenerate-skus.ts --apply    # exécute pour vrai
 *
 * Pousse les nouveaux SKU vers Clover si le produit a un cloverId.
 * Les pushes Clover en échec partent en queue de retry classique (CloverSyncQueue).
 *
 * NB : les credentials Clover sont marqués Sensitive sur Vercel donc pas pullables
 * localement. Pour pousser vers Clover en local, exporte manuellement
 * CLOVER_MERCHANT_ID et CLOVER_API_TOKEN avant de lancer le script.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SKU_PATTERN = /^\d{4}$/;
const APPLY_MODE = process.argv.includes('--apply');
const CHUNK_SIZE = 5;

interface PlanRow {
  productId: string;
  name: string;
  oldSku: string | null;
  newSku: string;
  cloverId: string | null;
  willChange: boolean;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(`  MIGRATION SKU → 4 chiffres séquentiels`);
  console.log(`  Mode : ${APPLY_MODE ? '⚠ APPLY (modifications réelles)' : '🔍 DRY-RUN (aucune modif)'}`);
  console.log('═══════════════════════════════════════════');
  console.log('');

  const products = await prisma.product.findMany({
    select: { id: true, name: true, sku: true, cloverId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total produits à traiter : ${products.length}`);
  if (products.length > 9999) {
    console.error('❌ Plus de 9999 produits — le format 4 chiffres ne suffit pas. Annulation.');
    process.exit(1);
  }

  const plan: PlanRow[] = products.map((p, i) => {
    const newSku = String(i + 1).padStart(4, '0');
    const willChange = p.sku !== newSku;
    return {
      productId: p.id,
      name: p.name,
      oldSku: p.sku,
      newSku,
      cloverId: p.cloverId,
      willChange,
    };
  });

  const toChange = plan.filter((r) => r.willChange);
  console.log(`  À changer : ${toChange.length}`);
  console.log(`  Déjà bon  : ${plan.length - toChange.length}`);
  console.log('');

  console.log('Aperçu des 20 premiers changements :');
  for (const row of toChange.slice(0, 20)) {
    const oldDisplay = row.oldSku ? row.oldSku.padEnd(20) : '(null)              ';
    console.log(`  ${row.newSku} ← ${oldDisplay} | ${row.name.slice(0, 40)}`);
  }
  if (toChange.length > 20) {
    console.log(`  ... et ${toChange.length - 20} autres`);
  }
  console.log('');

  if (!APPLY_MODE) {
    console.log('═══════════════════════════════════════════');
    console.log('  ✓ DRY-RUN terminé. Aucune modification.');
    console.log('  Pour appliquer : npx tsx prisma/scripts/regenerate-skus.ts --apply');
    console.log('═══════════════════════════════════════════');
    return;
  }

  console.log('═══════════════════════════════════════════');
  console.log('  APPLICATION DES CHANGEMENTS');
  console.log('═══════════════════════════════════════════');

  // 1) Update DB en 2 phases pour éviter les collisions de SKU uniques
  //    Phase A : mettre des SKU temporaires (préfixe TMP_)
  //    Phase B : mettre les vrais nouveaux SKU
  console.log('  Phase A : SKU temporaires pour éviter collisions...');
  let counterA = 0;
  for (const row of toChange) {
    await prisma.product.update({
      where: { id: row.productId },
      data: { sku: `TMP_${row.productId.slice(0, 8)}` },
    });
    counterA++;
    if (counterA % 20 === 0) process.stdout.write(`    ${counterA}/${toChange.length}\r`);
  }
  console.log(`    ✓ ${counterA}/${toChange.length} en temporaire`);

  console.log('  Phase B : SKU définitifs...');
  let counterB = 0;
  for (const row of toChange) {
    await prisma.product.update({
      where: { id: row.productId },
      data: { sku: row.newSku },
    });
    counterB++;
    if (counterB % 20 === 0) process.stdout.write(`    ${counterB}/${toChange.length}\r`);
  }
  console.log(`    ✓ ${counterB}/${toChange.length} en définitif`);

  // 2) Pousser les nouveaux SKU vers Clover (uniquement pour les produits liés)
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const apiToken = process.env.CLOVER_API_TOKEN;
  const linked = toChange.filter((r) => r.cloverId);

  console.log('');
  console.log(`  Push SKU vers Clover : ${linked.length} produits liés`);

  if (!merchantId || !apiToken) {
    console.log('  ⚠ CLOVER_MERCHANT_ID ou CLOVER_API_TOKEN manquant en local.');
    console.log('    DB mise à jour MAIS Clover non touché.');
    console.log('    Solutions :');
    console.log('      a) Lancer ce script depuis prod (impossible — script CLI)');
    console.log('      b) Pousser manuellement depuis /admin/clover après');
    console.log('      c) Set vars en local puis re-run avec --apply');
    return;
  }

  const region = process.env.CLOVER_REGION || 'us';
  const host =
    region === 'eu' ? 'https://api.eu.clover.com' : region === 'la' ? 'https://api.la.clover.com' : 'https://api.clover.com';

  let pushOk = 0;
  let pushFail = 0;

  for (let i = 0; i < linked.length; i += CHUNK_SIZE) {
    const chunk = linked.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const res = await fetch(`${host}/v3/merchants/${merchantId}/items/${row.cloverId}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sku: row.newSku }),
          });
          if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.warn(`    ✗ ${row.newSku} (${row.name.slice(0, 30)}) Clover ${res.status} : ${body.slice(0, 100)}`);
            // Mise en queue pour retry
            await prisma.cloverSyncQueue.create({
              data: {
                productId: row.productId,
                action: 'UPDATE',
                payload: JSON.stringify({ cloverId: row.cloverId, data: { sku: row.newSku } }),
                status: 'PENDING',
                attempts: 0,
                lastError: `SKU migration push ${res.status}`.slice(0, 500),
                nextAttemptAt: new Date(Date.now() + 60_000),
              },
            });
            pushFail++;
          } else {
            pushOk++;
          }
        } catch (err) {
          console.warn(`    ✗ ${row.newSku} (${row.name.slice(0, 30)}) erreur réseau`, err);
          pushFail++;
        }
      }),
    );
    process.stdout.write(`    ${Math.min(i + CHUNK_SIZE, linked.length)}/${linked.length}\r`);
  }

  console.log('');
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  RÉSUMÉ');
  console.log('═══════════════════════════════════════════');
  console.log(`  Produits DB mis à jour     : ${toChange.length}`);
  console.log(`  Pushes Clover réussis      : ${pushOk}`);
  console.log(`  Pushes Clover en queue     : ${pushFail}`);
  console.log('');
  console.log('  ✓ Migration terminée.');
  console.log('  Vérifie : npx tsx prisma/scripts/check-clover-state.ts');
}

main()
  .catch((err) => {
    console.error('ERREUR FATALE :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
