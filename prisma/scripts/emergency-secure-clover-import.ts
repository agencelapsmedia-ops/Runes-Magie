/**
 * ⚠️ SCRIPT D'URGENCE — sécurisation après import accidentel.
 *
 * Lance :
 *   1) Marque inStock=false sur tous les produits créés aujourd'hui après 18:00
 *      qui ont un cloverId (= importés du sync Clover → site qui a mal tourné).
 *   2) Marque toutes les entrées CloverSyncQueue PENDING comme
 *      FAILED_MAX_ATTEMPTS pour stopper le cron quotidien de retry.
 *
 * Réversible : les produits restent en DB, on les ré-active après nettoyage.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fenêtre temporelle : produits créés après cette date sont considérés
// comme des imports accidentels.
const CUTOFF_DATE = new Date('2026-05-19T18:00:00Z');

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('SÉCURISATION POST-IMPORT CLOVER');
  console.log('═══════════════════════════════════════════');
  console.log(`Cutoff : produits créés après ${CUTOFF_DATE.toISOString()}`);
  console.log('');

  // ────────────────────────────────────────────────────
  // 1) Identifier les produits importés à cacher
  // ────────────────────────────────────────────────────
  const importedProducts = await prisma.product.findMany({
    where: {
      createdAt: { gte: CUTOFF_DATE },
      cloverId: { not: null },
    },
    select: { id: true, name: true, category: true, cloverId: true, inStock: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`1) Produits importés trouvés : ${importedProducts.length}`);
  for (const p of importedProducts.slice(0, 15)) {
    console.log(`   - ${p.name.padEnd(40)} | cat=${p.category.padEnd(20)} | cloverId=${p.cloverId} | inStock=${p.inStock}`);
  }
  if (importedProducts.length > 15) {
    console.log(`   ... et ${importedProducts.length - 15} autres`);
  }

  if (importedProducts.length === 0) {
    console.log('   (rien à cacher)');
  } else {
    console.log('');
    console.log(`   → Marque inStock=false sur ces ${importedProducts.length} produits...`);
    const updateResult = await prisma.product.updateMany({
      where: {
        createdAt: { gte: CUTOFF_DATE },
        cloverId: { not: null },
      },
      data: { inStock: false, featured: false },
    });
    console.log(`   ✓ ${updateResult.count} produits cachés (inStock=false, featured=false)`);
  }

  // ────────────────────────────────────────────────────
  // 2) Vider la queue de retry
  // ────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════');
  const pendingQueue = await prisma.cloverSyncQueue.count({
    where: { status: 'PENDING' },
  });
  console.log(`2) Entrées CloverSyncQueue PENDING : ${pendingQueue}`);

  if (pendingQueue > 0) {
    console.log(`   → Marque toutes en FAILED_MAX_ATTEMPTS pour stopper le retry...`);
    const queueResult = await prisma.cloverSyncQueue.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'FAILED_MAX_ATTEMPTS', lastError: 'Stopped manually — bug alternateName > 127 chars à corriger' },
    });
    console.log(`   ✓ ${queueResult.count} entrées désactivées du retry quotidien`);
  } else {
    console.log('   (queue déjà vide, rien à faire)');
  }

  // ────────────────────────────────────────────────────
  // 3) État final pour confirmation
  // ────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('ÉTAT FINAL');
  console.log('═══════════════════════════════════════════');
  const totalProducts = await prisma.product.count();
  const visibleProducts = await prisma.product.count({ where: { inStock: true } });
  const linkedToClover = await prisma.product.count({ where: { cloverId: { not: null } } });
  const queueByStatus = await prisma.cloverSyncQueue.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  console.log(`  Total produits DB         : ${totalProducts}`);
  console.log(`  Visibles (inStock=true)   : ${visibleProducts}`);
  console.log(`  Liés à Clover (cloverId)  : ${linkedToClover}`);
  console.log(`  Queue Clover :`);
  for (const q of queueByStatus) {
    console.log(`    ${q.status.padEnd(22)} → ${q._count.id}`);
  }
}

main()
  .catch((err) => {
    console.error('ERREUR :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
