/**
 * Verify-backfill — Vérifie l'intégrité de la migration legacy → V2
 *
 * Usage:
 *   npm run db:verify
 *
 * Compare les counts entre anciennes et nouvelles tables, vérifie l'intégrité
 * référentielle, et liste les bookings/users orphelins.
 *
 * Sortie : code 0 si tout OK, code 1 si anomalies détectées.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Check {
  name: string;
  legacy: number;
  v2: number;
  ok: boolean;
  detail?: string;
}

const checks: Check[] = [];
const warnings: string[] = [];

async function main() {
  console.log('━'.repeat(60));
  console.log('🔍 VÉRIFICATION DU BACKFILL');
  console.log('━'.repeat(60));

  // 1. Users : HolisticUser + AdminUser ≤ User (V2 peut avoir des guests en plus)
  const adminCount = await prisma.adminUser.count();
  const holisticUserCount = await prisma.holisticUser.count();
  const userCount = await prisma.user.count();
  // Note : il peut y avoir des doublons d'email entre AdminUser et HolisticUser → V2 dédupe.
  // Donc V2 doit avoir AU MOINS le nombre unique d'emails entre les 2 tables.
  const adminEmails = (await prisma.adminUser.findMany({ select: { email: true } })).map((u) => u.email);
  const holisticEmails = (await prisma.holisticUser.findMany({ select: { email: true } })).map((u) => u.email);
  const uniqueLegacyEmails = new Set([...adminEmails, ...holisticEmails]).size;
  checks.push({
    name: 'Users (emails uniques legacy → User V2)',
    legacy: uniqueLegacyEmails,
    v2: userCount,
    ok: userCount >= uniqueLegacyEmails,
    detail: `AdminUser=${adminCount}, HolisticUser=${holisticUserCount}, uniques=${uniqueLegacyEmails}, User V2=${userCount}`,
  });

  // 2. Noctura : doit avoir 1 User role=ADMIN ET 1 Practitioner isOwner=true
  const adminCount2 = await prisma.user.count({ where: { role: 'ADMIN' } });
  const ownerCount = await prisma.practitioner.count({ where: { isOwner: true } });
  checks.push({
    name: 'Noctura (User ADMIN + Practitioner isOwner)',
    legacy: 1,
    v2: Math.min(adminCount2, ownerCount),
    ok: adminCount2 >= 1 && ownerCount === 1,
    detail: `Users ADMIN=${adminCount2}, Practitioners isOwner=${ownerCount}`,
  });
  if (ownerCount > 1) {
    warnings.push(`⚠️  ${ownerCount} Practitioners marqués isOwner=true — il ne devrait y en avoir qu'un (Noctura).`);
  }

  // 3. BookingService → Offering : tous les slugs doivent exister en Offering
  const services = await prisma.bookingService.findMany({ select: { slug: true } });
  const offeringSlugs = new Set((await prisma.offering.findMany({ select: { slug: true } })).map((o) => o.slug));
  const missingOfferings = services.filter((s) => !offeringSlugs.has(s.slug));
  checks.push({
    name: 'BookingService → Offering (slug match)',
    legacy: services.length,
    v2: services.length - missingOfferings.length,
    ok: missingOfferings.length === 0,
    detail: missingOfferings.length > 0 ? `Manquants : ${missingOfferings.map((s) => s.slug).join(', ')}` : 'Tous migrés',
  });

  // 4. Appointments + HolisticAppointments ≤ Bookings
  const apptCount = await prisma.appointment.count();
  const holisticApptCount = await prisma.holisticAppointment.count();
  const bookingCount = await prisma.booking.count();
  checks.push({
    name: 'Appointments + HolisticAppointments → Bookings',
    legacy: apptCount + holisticApptCount,
    v2: bookingCount,
    ok: bookingCount >= apptCount + holisticApptCount,
    detail: `Appointment=${apptCount}, HolisticAppointment=${holisticApptCount}, Booking V2=${bookingCount}`,
  });

  // 5. HolisticPayment → Payment
  const holisticPayCount = await prisma.holisticPayment.count();
  const paymentCount = await prisma.payment.count();
  checks.push({
    name: 'HolisticPayment → Payment',
    legacy: holisticPayCount,
    v2: paymentCount,
    ok: paymentCount >= holisticPayCount,
    detail: `HolisticPayment=${holisticPayCount}, Payment V2=${paymentCount}`,
  });

  // 6. Bookings legacy doivent tous être retrouvés en V2 (par confirmationToken)
  const legacyTokens = (await prisma.appointment.findMany({ select: { confirmationToken: true } })).map((a) => a.confirmationToken);
  const migratedTokens = new Set(
    (await prisma.booking.findMany({
      where: { confirmationToken: { in: legacyTokens } },
      select: { confirmationToken: true },
    })).map((b) => b.confirmationToken),
  );
  const missingTokens = legacyTokens.filter((t) => !migratedTokens.has(t));
  checks.push({
    name: 'Appointment.confirmationToken → Booking (préservation des liens email)',
    legacy: legacyTokens.length,
    v2: legacyTokens.length - missingTokens.length,
    ok: missingTokens.length === 0,
    detail: missingTokens.length > 0
      ? `${missingTokens.length} tokens manquants en V2 (les emails de confirmation déjà envoyés ne pointeront nulle part)`
      : 'Tous les tokens préservés',
  });

  // 7. Practitioners legacy : tous doivent avoir userV2Id
  const unlinkedPractitioners = await prisma.practitioner.findMany({
    where: { userV2Id: null },
    select: { slug: true, user: { select: { email: true } } },
  });
  checks.push({
    name: 'Practitioners → userV2Id (tous liés)',
    legacy: await prisma.practitioner.count(),
    v2: (await prisma.practitioner.count()) - unlinkedPractitioners.length,
    ok: unlinkedPractitioners.length === 0,
    detail: unlinkedPractitioners.length > 0
      ? `Non liés : ${unlinkedPractitioners.map((p) => `${p.slug}<${p.user.email}>`).join(', ')}`
      : 'Tous liés',
  });

  // 8. Availabilities : AvailabilityRule + HolisticAvailability ≤ Availability
  const ruleCount = await prisma.availabilityRule.count({ where: { isActive: true } });
  const holisticAvCount = await prisma.holisticAvailability.count({ where: { isActive: true } });
  const avCount = await prisma.availability.count();
  checks.push({
    name: 'AvailabilityRule + HolisticAvailability → Availability',
    legacy: ruleCount + holisticAvCount,
    v2: avCount,
    ok: avCount >= Math.max(ruleCount, holisticAvCount), // dédup possible
    detail: `AvailabilityRule=${ruleCount}, HolisticAvailability=${holisticAvCount}, Availability V2=${avCount}`,
  });

  // Affichage
  console.log('\n📋 Checks :');
  let allOk = true;
  for (const c of checks) {
    const icon = c.ok ? '✅' : '❌';
    console.log(`  ${icon} ${c.name}`);
    console.log(`     legacy=${c.legacy}  v2=${c.v2}  ${c.detail ?? ''}`);
    if (!c.ok) allOk = false;
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings :');
    warnings.forEach((w) => console.log(`  ${w}`));
  }

  console.log('━'.repeat(60));
  if (allOk) {
    console.log('✅ Tous les checks passent. Backfill OK.');
    process.exit(0);
  } else {
    console.log('❌ Anomalies détectées. Voir détails ci-dessus.');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('💥 Erreur :', e);
    process.exit(2);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
