/**
 * Supprime TOUS les RDV holistiques (HolisticAppointment) et les paiements associés.
 *
 * ⚠️ ATTENTION : irréversible. À utiliser uniquement pour repartir de zéro en test.
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/reset-all-appointments.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹 Reset complet des RDV holistiques\n');

  const apptCount = await prisma.holisticAppointment.count();
  const paymentCount = await prisma.holisticPayment.count();
  const notifCount = await prisma.holisticNotification.count();
  const reviewCount = await prisma.holisticReview.count();

  console.log(`État actuel :`);
  console.log(`  • ${apptCount} RDV`);
  console.log(`  • ${paymentCount} paiement(s)`);
  console.log(`  • ${notifCount} notification(s)`);
  console.log(`  • ${reviewCount} avis\n`);

  if (apptCount === 0) {
    console.log('✓ Déjà vide — rien à supprimer.\n');
    return;
  }

  // Ordre de suppression important à cause des FK
  // 1) Avis (FK vers appointment)
  const deletedReviews = await prisma.holisticReview.deleteMany({});
  console.log(`✓ ${deletedReviews.count} avis supprimé(s)`);

  // 2) Notifications (FK vers appointment)
  const deletedNotifs = await prisma.holisticNotification.deleteMany({});
  console.log(`✓ ${deletedNotifs.count} notification(s) supprimée(s)`);

  // 3) Paiements (FK vers appointment)
  const deletedPayments = await prisma.holisticPayment.deleteMany({});
  console.log(`✓ ${deletedPayments.count} paiement(s) supprimé(s)`);

  // 4) Les RDV eux-mêmes
  const deletedAppts = await prisma.holisticAppointment.deleteMany({});
  console.log(`✓ ${deletedAppts.count} RDV supprimé(s)`);

  // Aussi côté V2 si dual-write — mais best-effort, on ignore les erreurs
  try {
    const deletedV2Bookings = await prisma.booking.deleteMany({});
    if (deletedV2Bookings.count > 0) {
      console.log(`✓ ${deletedV2Bookings.count} Booking V2 supprimé(s) (dual-write)`);
    }
  } catch {
    // ignore
  }
  try {
    const deletedV2Payments = await prisma.payment.deleteMany({});
    if (deletedV2Payments.count > 0) {
      console.log(`✓ ${deletedV2Payments.count} Payment V2 supprimé(s) (dual-write)`);
    }
  } catch {
    // ignore
  }

  console.log('\n✨ Reset complet effectué — tu peux refaire des résa de test depuis zéro.\n');
}

main()
  .catch((e) => { console.error('\n❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
