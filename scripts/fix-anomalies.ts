/**
 * Corrige les anomalies validées avec l'utilisateur.
 *   1. Supprime les réservations de test (+ Payment/Review/Notification liés)
 *   2. consultation-herboriste -> isActive = false
 *   3. Supprime le doublon connexion-vegetale-1
 *   4. Désactive les 2 offerings du compte REJECTED "Jonathan Laplante"
 *
 * DRY-RUN par défaut. Pour appliquer :
 *   npx tsx --env-file=.env.local scripts/fix-anomalies.ts --apply
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(`\n🛠  Correction des anomalies — mode ${APPLY ? 'APPLY (écriture)' : 'DRY-RUN (lecture seule)'}\n`);

  // --- 1. Réservations de test (toutes : 13, sur le compte de test) ---
  const bookings = await prisma.booking.findMany({ select: { id: true } });
  const bookingIds = bookings.map((b) => b.id);
  const [payCount, revCount, notifCount] = await Promise.all([
    prisma.payment.count({ where: { bookingId: { in: bookingIds } } }),
    prisma.review.count({ where: { bookingId: { in: bookingIds } } }),
    prisma.notification.count({ where: { bookingId: { in: bookingIds } } }),
  ]);
  console.log(`1. Réservations à supprimer : ${bookingIds.length}`);
  console.log(`   ↳ paiements liés: ${payCount} · avis: ${revCount} · notifications: ${notifCount}`);

  // --- 2. consultation-herboriste ---
  const herb = await prisma.offering.findUnique({ where: { slug: 'consultation-herboriste' }, select: { id: true, isActive: true } });
  console.log(`2. consultation-herboriste : isActive ${herb?.isActive} -> false ${herb ? '' : '(INTROUVABLE)'}`);

  // --- 3. doublon ---
  const dup = await prisma.offering.findUnique({ where: { slug: 'connexion-vegetale-1' }, select: { id: true, bookings: { select: { id: true } } } });
  console.log(`3. connexion-vegetale-1 : suppression ${dup ? `(bookings liés: ${dup.bookings.length})` : '(INTROUVABLE)'}`);
  if (dup && dup.bookings.length) console.log('   ⚠️  a des réservations — ne sera PAS supprimé.');

  // --- 4. offerings du praticien REJECTED ---
  const jon = await prisma.practitioner.findUnique({
    where: { slug: 'jonathan-laplante-1775244663295' },
    select: { id: true, status: true, offerings: { where: { isActive: true }, select: { id: true, slug: true } } },
  });
  console.log(`4. Praticien REJECTED "${jon?.status}" : désactiver ${jon?.offerings.length ?? 0} offering(s)`);
  jon?.offerings.forEach((o) => console.log(`   • ${o.slug}`));

  if (!APPLY) {
    console.log('\n💡 DRY-RUN : aucune écriture. Relance avec --apply pour exécuter.\n');
    return;
  }

  // ---- EXÉCUTION (transaction) ----
  await prisma.$transaction(async (tx) => {
    // 1
    if (bookingIds.length) {
      await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await tx.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await tx.notification.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    // 2
    if (herb) await tx.offering.update({ where: { id: herb.id }, data: { isActive: false } });
    // 3
    if (dup && dup.bookings.length === 0) await tx.offering.delete({ where: { id: dup.id } });
    // 4
    if (jon?.offerings.length)
      await tx.offering.updateMany({ where: { id: { in: jon.offerings.map((o) => o.id) } }, data: { isActive: false } });
  });

  console.log('\n✅ Corrections appliquées.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
