/**
 * Test direct du sync Clover pour un produit donné.
 * Usage : npx tsx prisma/scripts/test-clover-sync.ts <productId>
 *
 * Si pas de productId, prend le plus récent.
 *
 * Affiche TOUS les détails : config détectée, réponse Clover brute, erreurs.
 *
 * NB : les vars CLOVER_* sur Vercel sont "Sensitive" → non pullables localement.
 *      Ce script ne fonctionnera localement que si l'utilisateur exporte
 *      manuellement CLOVER_MERCHANT_ID + CLOVER_API_TOKEN avant de le lancer.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const apiToken = process.env.CLOVER_API_TOKEN;
  const region = process.env.CLOVER_REGION || 'us';

  console.log('═══════════════════════════════════════════');
  console.log('1) Configuration Clover détectée');
  console.log('═══════════════════════════════════════════');
  console.log(`  MERCHANT_ID : ${merchantId ? merchantId : '✗ MANQUANT'}`);
  console.log(`  API_TOKEN   : ${apiToken ? '✓ présent (longueur ' + apiToken.length + ', commence par ' + apiToken.slice(0, 4) + '...)' : '✗ MANQUANT'}`);
  console.log(`  REGION      : ${region}`);

  if (!merchantId || !apiToken) {
    console.log('');
    console.log('⚠ Variables manquantes. Pour lancer ce test, lance d\'abord :');
    console.log('  vercel env pull .env.local --environment=production --yes');
    console.log('(et autorise la commande)');
    process.exit(1);
  }

  const host = region === 'eu' ? 'https://api.eu.clover.com' : region === 'la' ? 'https://api.la.clover.com' : 'https://api.clover.com';

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('2) Test READ — GET /v3/merchants/{id}/items?limit=1');
  console.log('═══════════════════════════════════════════');
  const readRes = await fetch(`${host}/v3/merchants/${merchantId}/items?limit=1`, {
    headers: { Authorization: `Bearer ${apiToken}`, Accept: 'application/json' },
  });
  console.log(`  Status: ${readRes.status} ${readRes.statusText}`);
  const readBody = await readRes.text();
  console.log(`  Réponse (200 premiers chars): ${readBody.slice(0, 200)}`);

  if (!readRes.ok) {
    console.log('');
    console.log('⚠ Le READ a échoué. Le token n\'a probablement pas le scope INVENTORY:READ.');
    console.log('   Va dans Clover Dashboard → Setup → API Tokens → vérifie les scopes.');
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('3) Récupération du produit à tester');
  console.log('═══════════════════════════════════════════');
  const productId = process.argv[2];
  const product = productId
    ? await prisma.product.findUnique({ where: { id: productId } })
    : await prisma.product.findFirst({ where: { syncToClover: true, cloverId: null }, orderBy: { createdAt: 'desc' } });

  if (!product) {
    console.log('  Aucun produit trouvé.');
    process.exit(1);
  }
  console.log(`  ID         : ${product.id}`);
  console.log(`  Nom        : ${product.name}`);
  console.log(`  Catégorie  : ${product.category}`);
  console.log(`  Prix       : ${product.price} $`);
  console.log(`  SKU        : ${product.sku || '(null)'}`);
  console.log(`  cloverId   : ${product.cloverId || '(null)'}`);
  console.log(`  syncToClover: ${product.syncToClover}`);

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('4) Test WRITE — POST /v3/merchants/{id}/items');
  console.log('═══════════════════════════════════════════');
  const writeRes = await fetch(`${host}/v3/merchants/${merchantId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: product.name,
      price: Math.round(product.price * 100),
      sku: product.sku,
      alternateName: product.description,
      hidden: false,
    }),
  });
  console.log(`  Status: ${writeRes.status} ${writeRes.statusText}`);
  const writeBody = await writeRes.text();
  console.log(`  Réponse complète:`);
  console.log(`  ${writeBody.slice(0, 600)}`);

  if (writeRes.ok) {
    const created = JSON.parse(writeBody);
    console.log('');
    console.log(`  ✓ SUCCÈS — item créé dans Clover avec id = ${created.id}`);
    console.log('  Mise à jour du Product local avec ce cloverId...');
    await prisma.product.update({
      where: { id: product.id },
      data: { cloverId: created.id, cloverSyncedAt: new Date() },
    });
    console.log('  ✓ Product.cloverId mis à jour. Va vérifier sur Clover Dashboard.');
  } else {
    console.log('');
    console.log('  ✗ ÉCHEC — le token n\'a probablement pas INVENTORY:WRITE.');
    console.log('  Va sur Clover Dashboard → Setup → API Tokens → édite ton token → ajoute le scope INVENTORY:WRITE');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
