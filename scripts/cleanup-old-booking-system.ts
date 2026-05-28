/**
 * Cleanup étape 1 — Tabula rasa du vieux système /reserver
 *
 * Supprime :
 *   - Toutes les Appointment (table V2, 6 rangées attendues)
 *   - Toutes les BookingService (table V2, 4 rangées attendues)
 *
 * Le système nouveau (/soins) utilise des tables séparées (HolisticAppointment,
 * Practitioner, etc.) qui ne sont pas touchées.
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/cleanup-old-booking-system.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹 Cleanup du vieux système de réservation\n');

  const apptCount = await prisma.appointment.count();
  const svcCount = await prisma.bookingService.count();

  console.log(`État actuel : ${apptCount} Appointment(s), ${svcCount} BookingService(s)\n`);

  if (apptCount === 0 && svcCount === 0) {
    console.log('✓ Déjà vide — rien à supprimer.\n');
    return;
  }

  // 1) Supprimer les Appointments (a FK vers BookingService, donc d'abord)
  const deletedAppts = await prisma.appointment.deleteMany({});
  console.log(`✓ ${deletedAppts.count} Appointment(s) supprimé(s)`);

  // 2) Supprimer les BookingServices
  const deletedSvcs = await prisma.bookingService.deleteMany({});
  console.log(`✓ ${deletedSvcs.count} BookingService(s) supprimé(s)`);

  console.log('\n✨ Tabula rasa effectuée — le système /soins est maintenant le seul actif.\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Erreur :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
