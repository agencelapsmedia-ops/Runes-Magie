/**
 * Backfill — Migration des données legacy vers les modèles V2 unifiés
 *
 * Usage:
 *   npm run db:backfill:dry    # simulation (logs uniquement, aucun write)
 *   npm run db:backfill        # applique réellement
 *
 * Idempotent — peut être ré-exécuté sans dupliquer de données.
 *
 * Ordre des étapes :
 *   1. User Noctura (depuis AdminUser, role=ADMIN)
 *   2. Practitioner Noctura (isOwner=true, commissionPct=0) lié à userV2Id
 *   3. BookingService -> Offering (practitionerId=Noctura, type=SOIN/COURS auto-détecté)
 *   4. AvailabilityRule (Noctura) -> Availability
 *   5. HolisticUser -> User (idempotent par email)
 *   6. Practitioners existants -> userV2Id rempli (par email match)
 *   7. Appointment (anonyme) -> Booking (+ User guest si email inconnu)
 *   8. HolisticAppointment -> Booking
 *   9. HolisticPayment -> Payment
 *  10. HolisticAvailability -> Availability
 *
 * Variables d'env utilisées :
 *   - DATABASE_URL (Prisma)
 *   - NOCTURA_EMAIL (optionnel, défaut = email du premier AdminUser)
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

interface Stats {
  usersCreated: number;
  usersLinked: number;
  practitionersUpdated: number;
  offeringsCreated: number;
  availabilitiesCreated: number;
  bookingsCreated: number;
  paymentsCreated: number;
  errors: string[];
}

const stats: Stats = {
  usersCreated: 0,
  usersLinked: 0,
  practitionersUpdated: 0,
  offeringsCreated: 0,
  availabilitiesCreated: 0,
  bookingsCreated: 0,
  paymentsCreated: 0,
  errors: [],
};

function log(emoji: string, msg: string) {
  console.log(`${emoji}  ${msg}`);
}

function placeholderHash(): string {
  // Hash bcrypt-like placeholder (60 chars) que personne ne pourra deviner.
  // Les clients devront utiliser "mot de passe oublié" pour définir un vrai mdp.
  return '$2b$10$INVALID' + randomBytes(20).toString('hex');
}

function detectOfferingType(slug: string, name: string): 'SOIN' | 'COURS' | 'CEREMONIE' {
  const slugLower = slug.toLowerCase();
  const nameLower = name.toLowerCase();
  if (
    slugLower.includes('cours') ||
    slugLower.includes('formation') ||
    nameLower.includes('cours') ||
    nameLower.includes('formation')
  ) {
    return 'COURS';
  }
  if (
    slugLower.includes('ceremonie') ||
    slugLower.includes('cérémonie') ||
    nameLower.includes('cérémonie') ||
    nameLower.includes('animation')
  ) {
    return 'CEREMONIE';
  }
  return 'SOIN';
}

function combineDateTime(date: Date, hhmm: string): Date {
  // Combine une date (00:00 UTC) avec une heure "HH:mm" en zone America/Toronto.
  // Approximation : on stocke en UTC, l'application fera la conversion timezone.
  const [hours, minutes] = hhmm.split(':').map(Number);
  const result = new Date(date);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
}

// ════════════════════════════════════════════════════════════════
// Étape 1 : User Noctura
// ════════════════════════════════════════════════════════════════
async function backfillNocturaUser() {
  log('🔮', 'Étape 1 — User Noctura (depuis AdminUser)');

  const adminUser = await prisma.adminUser.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    throw new Error('Aucun AdminUser trouvé. Le backfill ne peut pas bootstraper Noctura.');
  }
  const email = process.env.NOCTURA_EMAIL ?? adminUser.email;
  log('  📧', `Email Noctura : ${email}`);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    log('  ✓', `User Noctura existe déjà (${existing.id}). Skip.`);
    return existing;
  }

  if (DRY_RUN) {
    log('  ⊙', `[DRY] Créerait User { email: ${email}, role: ADMIN }`);
    return { id: '__dry_noctura__', email } as { id: string; email: string };
  }

  const created = await prisma.user.create({
    data: {
      email,
      hashedPassword: adminUser.hashedPassword, // bcrypt compatible
      role: 'ADMIN',
      firstName: 'Noctura',
      lastName: adminUser.name ?? 'Anna',
    },
  });
  stats.usersCreated++;
  log('  ✓', `User Noctura créée (${created.id})`);
  return created;
}

// ════════════════════════════════════════════════════════════════
// Étape 2 : Practitioner Noctura
// ════════════════════════════════════════════════════════════════
async function backfillNocturaPractitioner(nocturaUserId: string) {
  log('🔮', 'Étape 2 — Practitioner Noctura (isOwner=true, commissionPct=0)');

  // Déjà existant ?
  let practitioner = await prisma.practitioner.findFirst({ where: { isOwner: true } });
  if (practitioner) {
    if (!practitioner.userV2Id && !DRY_RUN) {
      await prisma.practitioner.update({
        where: { id: practitioner.id },
        data: { userV2Id: nocturaUserId },
      });
      stats.practitionersUpdated++;
    }
    log('  ✓', `Practitioner Noctura existe (${practitioner.slug}). Linked userV2Id.`);
    return practitioner;
  }

  // Chercher par HolisticUser correspondant
  const nocturaEmail = (await prisma.user.findUnique({ where: { id: nocturaUserId } }))?.email
    ?? process.env.NOCTURA_EMAIL;
  if (nocturaEmail) {
    const hu = await prisma.holisticUser.findUnique({
      where: { email: nocturaEmail },
      include: { practitioner: true },
    });
    if (hu?.practitioner) {
      if (!DRY_RUN) {
        practitioner = await prisma.practitioner.update({
          where: { id: hu.practitioner.id },
          data: {
            isOwner: true,
            commissionPct: 0,
            status: 'APPROVED',
            approvedAt: hu.practitioner.approvedAt ?? new Date(),
            userV2Id: nocturaUserId,
          },
        });
        stats.practitionersUpdated++;
      }
      log('  ✓', `Practitioner Noctura trouvée via HolisticUser et promue propriétaire.`);
      return practitioner;
    }
  }

  // Pas de Practitioner Noctura -> en créer un
  if (DRY_RUN) {
    log('  ⊙', `[DRY] Créerait Practitioner Noctura {slug: noctura-anna, isOwner: true}`);
    return { id: '__dry_practitioner__', slug: 'noctura-anna' } as { id: string; slug: string };
  }

  // Créer HolisticUser stub (pour compat legacy) puis Practitioner
  const stubHU = await prisma.holisticUser.upsert({
    where: { email: nocturaEmail ?? 'noctura@runesetmagie.ca' },
    create: {
      email: nocturaEmail ?? 'noctura@runesetmagie.ca',
      hashedPassword: placeholderHash(),
      role: 'ADMIN',
      firstName: 'Noctura',
      lastName: 'Anna',
    },
    update: {},
  });

  practitioner = await prisma.practitioner.create({
    data: {
      userId: stubHU.id,
      userV2Id: nocturaUserId,
      slug: 'noctura-anna',
      status: 'APPROVED',
      bio: 'Praticienne des arts ancestraux, propriétaire de Runes & Magie. Spécialiste en runes Futhark, tarot, magie naturelle et soins énergétiques.',
      specialties: ['Reiki', 'Naturopathie', 'Cristallothérapie', 'Soins Chamaniques'],
      yearsExperience: 20,
      hourlyRate: 80,
      isOwner: true,
      commissionPct: 0,
      approvedAt: new Date(),
    },
  });
  stats.practitionersUpdated++;
  log('  ✓', `Practitioner Noctura créée (${practitioner.slug})`);
  return practitioner;
}

// ════════════════════════════════════════════════════════════════
// Étape 3 : BookingService → Offering
// ════════════════════════════════════════════════════════════════
async function backfillOfferings(nocturaPractitionerId: string) {
  log('🔮', 'Étape 3 — BookingService → Offering');

  const services = await prisma.bookingService.findMany();
  for (const svc of services) {
    const type = detectOfferingType(svc.slug, svc.name);
    const exists = await prisma.offering.findUnique({ where: { slug: svc.slug } });
    if (exists) {
      log('  =', `${svc.slug} déjà migré → skip`);
      continue;
    }
    if (DRY_RUN) {
      log('  ⊙', `[DRY] Offering { slug: ${svc.slug}, type: ${type}, price: ${svc.price} }`);
      continue;
    }
    await prisma.offering.create({
      data: {
        practitionerId: nocturaPractitionerId,
        type,
        slug: svc.slug,
        name: svc.name,
        description: svc.description,
        durationMinutes: svc.durationMinutes,
        bufferMinutes: svc.bufferMinutes,
        price: svc.price ?? 0,
        capacity: svc.maxPerSlot,
        colorHex: svc.colorHex,
        emoji: svc.emoji,
        modes: ['IN_PERSON'], // défaut sûr, Noctura activera VIRTUAL ensuite
        isActive: svc.isActive,
        isFeatured: true, // tous les services existants seront mis en avant
      },
    });
    stats.offeringsCreated++;
    log('  ✓', `Offering créée : ${svc.slug} (${type})`);
  }
}

// ════════════════════════════════════════════════════════════════
// Étape 4 : AvailabilityRule (Noctura) → Availability
// ════════════════════════════════════════════════════════════════
async function backfillNocturaAvailability(nocturaPractitionerId: string) {
  log('🔮', 'Étape 4 — AvailabilityRule → Availability (Noctura)');

  const rules = await prisma.availabilityRule.findMany({ where: { isActive: true } });
  // Dédupliquer par (dayOfWeek, startTime, endTime)
  const seen = new Set<string>();
  for (const r of rules) {
    const key = `${r.dayOfWeek}|${r.startTime}|${r.endTime}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const existing = await prisma.availability.findFirst({
      where: {
        practitionerId: nocturaPractitionerId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      },
    });
    if (existing) continue;

    if (DRY_RUN) {
      log('  ⊙', `[DRY] Availability Noctura jour=${r.dayOfWeek} ${r.startTime}-${r.endTime}`);
      continue;
    }
    await prisma.availability.create({
      data: {
        practitionerId: nocturaPractitionerId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        isActive: true,
      },
    });
    stats.availabilitiesCreated++;
  }
  log('  ✓', `${stats.availabilitiesCreated} availabilities créées pour Noctura`);
}

// ════════════════════════════════════════════════════════════════
// Étape 5 : HolisticUser → User (par email)
// ════════════════════════════════════════════════════════════════
async function backfillHolisticUsers() {
  log('🔮', 'Étape 5 — HolisticUser → User (par email)');

  const hus = await prisma.holisticUser.findMany();
  for (const hu of hus) {
    const existing = await prisma.user.findUnique({ where: { email: hu.email } });
    if (existing) continue;

    if (DRY_RUN) {
      log('  ⊙', `[DRY] User créerait depuis HolisticUser ${hu.email} (role=${hu.role})`);
      continue;
    }
    await prisma.user.create({
      data: {
        email: hu.email,
        hashedPassword: hu.hashedPassword,
        role: hu.role,
        firstName: hu.firstName,
        lastName: hu.lastName,
        phone: hu.phone,
        locale: hu.locale,
        dischargeSignedAt: hu.dischargeSignedAt,
        dischargeIp: hu.dischargeIp,
        dischargeHash: hu.dischargeHash,
        createdAt: hu.createdAt,
      },
    });
    stats.usersCreated++;
  }
  log('  ✓', `${stats.usersCreated} Users créés (cumul)`);
}

// ════════════════════════════════════════════════════════════════
// Étape 6 : Practitioners existants → userV2Id (par email match)
// ════════════════════════════════════════════════════════════════
async function linkPractitionersToUserV2() {
  log('🔮', 'Étape 6 — Practitioners existants → userV2Id (par email match)');

  const practitioners = await prisma.practitioner.findMany({
    where: { userV2Id: null },
    include: { user: true },
  });
  for (const p of practitioners) {
    const newUser = await prisma.user.findUnique({ where: { email: p.user.email } });
    if (!newUser) {
      stats.errors.push(`Practitioner ${p.slug}: aucun User V2 trouvé pour email ${p.user.email}`);
      continue;
    }
    if (DRY_RUN) {
      log('  ⊙', `[DRY] Linker Practitioner ${p.slug} → User ${newUser.id}`);
      continue;
    }
    await prisma.practitioner.update({
      where: { id: p.id },
      data: { userV2Id: newUser.id },
    });
    stats.usersLinked++;
  }
  log('  ✓', `${stats.usersLinked} Practitioners liés au nouveau User`);
}

// ════════════════════════════════════════════════════════════════
// Étape 7 : Appointment (anonyme, Noctura) → Booking
// ════════════════════════════════════════════════════════════════
async function backfillAppointments(nocturaPractitionerId: string) {
  log('🔮', 'Étape 7 — Appointment → Booking (System 1, Noctura)');

  const appts = await prisma.appointment.findMany({ include: { service: true } });
  for (const a of appts) {
    // Booking existe déjà ? (dédup par confirmationToken)
    const existing = await prisma.booking.findUnique({
      where: { confirmationToken: a.confirmationToken },
    });
    if (existing) continue;

    // Trouver ou créer User client (par email)
    let client = await prisma.user.findUnique({ where: { email: a.clientEmail } });
    if (!client) {
      if (DRY_RUN) {
        log('  ⊙', `[DRY] User guest créerait pour ${a.clientEmail}`);
      } else {
        const [firstName, ...rest] = a.clientName.split(' ');
        client = await prisma.user.create({
          data: {
            email: a.clientEmail,
            hashedPassword: placeholderHash(), // forced password reset à la prochaine connexion
            role: 'CLIENT',
            firstName: firstName ?? a.clientName,
            lastName: rest.join(' ') || '—',
            phone: a.clientPhone,
            createdAt: a.createdAt,
          },
        });
        stats.usersCreated++;
      }
    }

    // Trouver l'Offering correspondante (par slug, créée à l'étape 3)
    const offering = await prisma.offering.findUnique({ where: { slug: a.service.slug } });
    if (!offering) {
      stats.errors.push(`Appointment ${a.id}: Offering ${a.service.slug} introuvable`);
      continue;
    }

    const startsAt = combineDateTime(a.date, a.startTime);
    const endsAt = combineDateTime(a.date, a.endTime);

    if (DRY_RUN) {
      log('  ⊙', `[DRY] Booking ${a.confirmationToken.slice(0, 8)} ${a.clientEmail} ${startsAt.toISOString()}`);
      continue;
    }

    await prisma.booking.create({
      data: {
        offeringId: offering.id,
        practitionerId: nocturaPractitionerId,
        clientId: client!.id,
        startsAt,
        endsAt,
        mode: 'IN_PERSON',
        status: a.status === 'confirmed' ? 'CONFIRMED' : (a.status === 'cancelled' ? 'CANCELLED' : 'PENDING_PAYMENT'),
        notes: a.notes,
        googleEventId: a.googleEventId,
        confirmationToken: a.confirmationToken,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      },
    });
    stats.bookingsCreated++;
  }
  log('  ✓', `${stats.bookingsCreated} Bookings créés (cumul Appointments)`);
}

// ════════════════════════════════════════════════════════════════
// Étape 8 : HolisticAppointment → Booking
// ════════════════════════════════════════════════════════════════
async function backfillHolisticAppointments() {
  log('🔮', 'Étape 8 — HolisticAppointment → Booking');

  const apps = await prisma.holisticAppointment.findMany({
    include: { client: true, practitioner: true, payment: true },
  });
  for (const a of apps) {
    // Dédup : on n'a pas de clé naturelle évidente. On utilise (practitionerId, startsAt, clientEmail)
    const existing = await prisma.booking.findFirst({
      where: {
        practitionerId: a.practitionerId,
        startsAt: a.startsAt,
        client: { email: a.client.email },
      },
    });
    if (existing) continue;

    const client = await prisma.user.findUnique({ where: { email: a.client.email } });
    if (!client) {
      stats.errors.push(`HolisticAppointment ${a.id}: User V2 introuvable pour ${a.client.email}`);
      continue;
    }

    // L'Offering pour ce praticien : V2 n'a pas encore d'Offering pour les praticiens externes.
    // On crée une Offering "générique" basée sur les specialties + hourlyRate.
    // Pour V1, on en crée UNE par praticien avec leur hourlyRate.
    const practitionerOfferingSlug = `consultation-${a.practitioner.slug}`;
    let offering = await prisma.offering.findUnique({ where: { slug: practitionerOfferingSlug } });
    if (!offering) {
      if (DRY_RUN) {
        log('  ⊙', `[DRY] Offering générique pour ${a.practitioner.slug}`);
        continue;
      }
      offering = await prisma.offering.create({
        data: {
          practitionerId: a.practitionerId,
          type: 'SOIN',
          slug: practitionerOfferingSlug,
          name: `Consultation avec ${a.practitioner.slug}`,
          description: a.practitioner.bio || 'Consultation holistique',
          durationMinutes: 60,
          price: a.practitioner.hourlyRate,
          modes: ['VIRTUAL'], // les soins holistiques originaux étaient virtuels via Daily
          isActive: true,
        },
      });
      stats.offeringsCreated++;
    }

    if (DRY_RUN) {
      log('  ⊙', `[DRY] Booking holistique ${a.id} → ${client.email} avec ${a.practitioner.slug}`);
      continue;
    }

    const booking = await prisma.booking.create({
      data: {
        offeringId: offering.id,
        practitionerId: a.practitionerId,
        clientId: client.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        mode: 'VIRTUAL',
        status: a.status === 'CONFIRMED' ? 'CONFIRMED'
              : a.status === 'CANCELLED' ? 'CANCELLED'
              : a.status === 'COMPLETED' ? 'COMPLETED'
              : 'PENDING_PAYMENT',
        notes: a.notes,
        dailyRoomUrl: a.dailyRoomUrl,
        dailyRoomName: a.dailyRoomName,
        cancelledAt: a.cancelledAt,
        cancelledBy: a.cancelledBy,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      },
    });
    stats.bookingsCreated++;

    // Payment associé ?
    if (a.payment) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          stripePaymentIntentId: a.payment.stripePaymentIntentId,
          stripeTransferId: a.payment.stripeTransferId,
          amountTotal: a.payment.amountTotal,
          amountCommission: a.payment.amountCommission,
          amountPractitioner: a.payment.amountPractitioner,
          commissionPct: 35,
          status: a.payment.status,
          paidAt: a.payment.paidAt,
          payoutAt: a.payment.payoutAt,
          createdAt: a.payment.createdAt,
        },
      });
      stats.paymentsCreated++;
    }
  }
  log('  ✓', `Bookings holistiques migrés (cumul: ${stats.bookingsCreated})`);
}

// ════════════════════════════════════════════════════════════════
// Étape 9 : HolisticAvailability → Availability
// ════════════════════════════════════════════════════════════════
async function backfillHolisticAvailability() {
  log('🔮', 'Étape 9 — HolisticAvailability → Availability');

  const has = await prisma.holisticAvailability.findMany();
  for (const ha of has) {
    const existing = await prisma.availability.findFirst({
      where: {
        practitionerId: ha.practitionerId,
        dayOfWeek: ha.dayOfWeek,
        startTime: ha.startTime,
        endTime: ha.endTime,
      },
    });
    if (existing) continue;
    if (DRY_RUN) {
      log('  ⊙', `[DRY] Availability ${ha.practitionerId} day=${ha.dayOfWeek}`);
      continue;
    }
    await prisma.availability.create({
      data: {
        practitionerId: ha.practitionerId,
        dayOfWeek: ha.dayOfWeek,
        startTime: ha.startTime,
        endTime: ha.endTime,
        isActive: ha.isActive,
      },
    });
    stats.availabilitiesCreated++;
  }
  log('  ✓', `${stats.availabilitiesCreated} availabilities (cumul)`);
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════
async function main() {
  const start = Date.now();
  console.log('━'.repeat(60));
  console.log(`🔮 BACKFILL UNIFIÉ — ${DRY_RUN ? 'DRY RUN (aucun write)' : 'APPLIQUÉ'}`);
  console.log('━'.repeat(60));

  const nocturaUser = await backfillNocturaUser();
  const nocturaPractitioner = await backfillNocturaPractitioner(nocturaUser.id);
  await backfillOfferings(nocturaPractitioner!.id);
  await backfillNocturaAvailability(nocturaPractitioner!.id);
  await backfillHolisticUsers();
  await linkPractitionersToUserV2();
  await backfillAppointments(nocturaPractitioner!.id);
  await backfillHolisticAppointments();
  await backfillHolisticAvailability();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('━'.repeat(60));
  console.log(`📊 RAPPORT (${elapsed}s) — ${DRY_RUN ? 'DRY' : 'APPLIQUÉ'}`);
  console.log('━'.repeat(60));
  console.log(`  Users créés         : ${stats.usersCreated}`);
  console.log(`  Practitioners liés  : ${stats.usersLinked}`);
  console.log(`  Practitioners maj   : ${stats.practitionersUpdated}`);
  console.log(`  Offerings créées    : ${stats.offeringsCreated}`);
  console.log(`  Availabilities      : ${stats.availabilitiesCreated}`);
  console.log(`  Bookings créés      : ${stats.bookingsCreated}`);
  console.log(`  Payments créés      : ${stats.paymentsCreated}`);
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ERREURS (${stats.errors.length}) :`);
    stats.errors.forEach((e) => console.log(`    - ${e}`));
  }
  console.log('━'.repeat(60));
  if (DRY_RUN) {
    console.log('ℹ️  Mode DRY RUN — rien n\'a été écrit en DB.');
    console.log('   Pour appliquer : npm run db:backfill');
  } else {
    console.log('✅ Backfill terminé. Vérifie avec : npm run db:verify');
  }
}

main()
  .catch((e) => {
    console.error('💥 Erreur fatale :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
