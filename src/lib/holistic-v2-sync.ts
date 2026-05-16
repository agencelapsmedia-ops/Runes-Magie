/**
 * Helpers de synchronisation Legacy → V2 (Phase 3 — dual-write)
 *
 * Pendant la phase de transition, les routes API holistiques continuent
 * d'écrire dans les modèles legacy (HolisticUser, HolisticAppointment,
 * HolisticPayment) ET miroitent en parallèle vers les modèles V2
 * (User, Booking, Payment, Offering).
 *
 * Toutes les fonctions sont :
 *  - **Idempotentes** : peuvent être appelées plusieurs fois sans dupliquer
 *  - **Best-effort** : à wrapper dans try/catch côté caller pour ne pas
 *    casser la requête legacy si la sync V2 échoue (legacy = source de vérité)
 *
 * Une fois la Phase 4 atteinte (lectures basculées sur V2), on pourra
 * supprimer les helpers et retirer le code legacy.
 */

import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';

const DEFAULT_COMMISSION_PCT = 35;
const DEFAULT_DURATION_MIN = 60;

export function v2PlaceholderHash(): string {
  // Hash bcrypt-style placeholder (~60 chars) inutilisable comme mdp réel.
  // Les utilisateurs créés via dual-write devront passer par "mot de passe oublié".
  return '$2b$10$INVALID' + randomBytes(20).toString('hex');
}

/**
 * Trouve ou crée l'Offering V2 générique pour un praticien.
 * Idempotent par slug = `consultation-{practitionerSlug}`.
 * Race-condition-safe : utilise upsert (slug unique).
 */
export async function getOrCreateOfferingForPractitioner(practitionerId: string) {
  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!practitioner) throw new Error(`Practitioner ${practitionerId} introuvable`);

  const slug = `consultation-${practitioner.slug}`;
  return prisma.offering.upsert({
    where: { slug },
    create: {
      practitionerId,
      type: 'SOIN',
      slug,
      name: `Consultation avec ${practitioner.user.firstName} ${practitioner.user.lastName}`,
      description: practitioner.bio || 'Consultation holistique',
      durationMinutes: DEFAULT_DURATION_MIN,
      price: practitioner.hourlyRate,
      modes: ['VIRTUAL'],
      isActive: true,
    },
    update: {}, // No-op si déjà créé (on ne veut pas écraser des modifs ultérieures de Noctura)
  });
}

/**
 * Trouve l'User V2 correspondant à un HolisticUser (matching par email).
 * Si absent, le crée en réutilisant les données du HolisticUser.
 * Race-condition-safe : utilise upsert (email unique).
 */
export async function getOrCreateV2UserFromHolistic(holisticUserId: string) {
  const hu = await prisma.holisticUser.findUnique({ where: { id: holisticUserId } });
  if (!hu) throw new Error(`HolisticUser ${holisticUserId} introuvable`);

  return prisma.user.upsert({
    where: { email: hu.email },
    create: {
      email: hu.email,
      hashedPassword: hu.hashedPassword, // bcrypt compatible
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
    update: {}, // Pas d'écrasement — l'utilisateur V2 peut avoir des modifs propres
  });
}

/**
 * Mappe un statut legacy HolisticAppointment vers un statut V2 Booking.
 * - PENDING legacy = "en attente de paiement Stripe" → PENDING_PAYMENT V2 (sera nettoyé par cron Phase 10)
 *   sauf si l'appointment est créé sans flow Stripe (praticien sans compte) — auquel cas le caller
 *   doit passer `noStripeFlow: true` pour forcer CONFIRMED.
 */
export function legacyStatusToV2(status: string, opts?: { noStripeFlow?: boolean }): string {
  if (status === 'CONFIRMED') return 'CONFIRMED';
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'COMPLETED') return 'COMPLETED';
  // PENDING legacy
  return opts?.noStripeFlow ? 'CONFIRMED' : 'PENDING_PAYMENT';
}

/**
 * Crée un Booking V2 miroir d'un HolisticAppointment.
 * Idempotent : si un Booking existe déjà pour (practitionerId, startsAt, clientId V2), retourne l'existant.
 *
 * Retourne le Booking V2 (créé ou existant), ou null en cas d'erreur attrapée par le caller.
 */
export async function mirrorAppointmentToBooking(params: {
  appointment: {
    id: string;
    clientId: string;
    practitionerId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    notes?: string | null;
    dailyRoomUrl?: string | null;
    dailyRoomName?: string | null;
  };
  noStripeFlow?: boolean;
}) {
  const { appointment } = params;

  const client = await getOrCreateV2UserFromHolistic(appointment.clientId);
  const offering = await getOrCreateOfferingForPractitioner(appointment.practitionerId);

  const existing = await prisma.booking.findFirst({
    where: {
      practitionerId: appointment.practitionerId,
      startsAt: appointment.startsAt,
      clientId: client.id,
    },
  });
  if (existing) return existing;

  return prisma.booking.create({
    data: {
      offeringId: offering.id,
      practitionerId: appointment.practitionerId,
      clientId: client.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      mode: 'VIRTUAL',
      status: legacyStatusToV2(appointment.status, { noStripeFlow: params.noStripeFlow }),
      notes: appointment.notes ?? null,
      dailyRoomUrl: appointment.dailyRoomUrl ?? null,
      dailyRoomName: appointment.dailyRoomName ?? null,
    },
  });
}

/**
 * Sync le statut V2 quand un HolisticAppointment change.
 * Si le Booking V2 n'existe pas encore (cas legacy pré-dual-write), tente
 * de le créer à la volée via mirrorAppointmentToBooking pour rattraper le retard.
 */
export async function syncAppointmentStatusToV2(params: {
  appointmentId: string;
  status: string;
  cancelledBy?: string | null;
}) {
  const a = await prisma.holisticAppointment.findUnique({
    where: { id: params.appointmentId },
    include: { client: { select: { email: true } } },
  });
  if (!a) {
    console.warn('[v2-sync] syncAppointmentStatusToV2 : HolisticAppointment introuvable', {
      appointmentId: params.appointmentId,
    });
    return null;
  }

  const v2Client = await prisma.user.findUnique({ where: { email: a.client.email } });

  // Si User V2 absent OU Booking absent → tenter le rattrapage via mirror
  if (!v2Client) {
    console.info('[v2-sync] User V2 absent → rattrapage via mirror', {
      appointmentId: params.appointmentId,
      email: a.client.email,
    });
    try {
      const newBooking = await mirrorAppointmentToBooking({ appointment: a });
      return newBooking;
    } catch (err) {
      console.error('[v2-sync] Rattrapage mirror échoué', { appointmentId: params.appointmentId, err });
      return null;
    }
  }

  const booking = await prisma.booking.findFirst({
    where: {
      practitionerId: a.practitionerId,
      startsAt: a.startsAt,
      clientId: v2Client.id,
    },
  });

  if (!booking) {
    console.info('[v2-sync] Booking V2 absent → rattrapage via mirror', {
      appointmentId: params.appointmentId,
    });
    try {
      const newBooking = await mirrorAppointmentToBooking({ appointment: a });
      return newBooking;
    } catch (err) {
      console.error('[v2-sync] Rattrapage mirror échoué', { appointmentId: params.appointmentId, err });
      return null;
    }
  }

  const newStatus = legacyStatusToV2(params.status);
  const isCancellation = params.status === 'CANCELLED';

  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: newStatus,
      ...(isCancellation
        ? { cancelledAt: new Date(), cancelledBy: params.cancelledBy ?? null }
        : {}),
    },
  });
}

/**
 * Crée un Payment V2 miroir d'un HolisticPayment.
 * Idempotent par bookingId (unique).
 */
export async function mirrorPaymentToV2(params: {
  bookingId: string;
  amountTotal: number;
  amountCommission: number;
  amountPractitioner: number;
  commissionPct?: number;
  status?: string;
}) {
  const existing = await prisma.payment.findUnique({ where: { bookingId: params.bookingId } });
  if (existing) return existing;

  return prisma.payment.create({
    data: {
      bookingId: params.bookingId,
      amountTotal: params.amountTotal,
      amountCommission: params.amountCommission,
      amountPractitioner: params.amountPractitioner,
      commissionPct: params.commissionPct ?? DEFAULT_COMMISSION_PCT,
      status: params.status ?? 'PENDING',
    },
  });
}

/**
 * Marque un Booking V2 et son Payment associé comme payés.
 * Appelé depuis le webhook Stripe après checkout.session.completed.
 *
 * Transactionnel : si une des 2 mises à jour échoue, aucune n'est appliquée.
 * Évite l'état incohérent (booking payé mais payment toujours PENDING ou vice versa).
 */
export async function markBookingPaidV2(params: {
  bookingId: string;
  stripePaymentIntentId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    // Vérifier que le booking existe et n'est pas déjà annulé (idempotence + cohérence)
    const booking = await tx.booking.findUnique({ where: { id: params.bookingId } });
    if (!booking) {
      throw new Error(`Booking V2 ${params.bookingId} introuvable lors du markPaid`);
    }
    if (booking.status === 'CANCELLED') {
      // Cas rare : annulé entre le checkout et le webhook. On log + ne marque pas comme payé.
      console.warn('[v2-sync] markBookingPaidV2 : booking déjà CANCELLED, skip', {
        bookingId: params.bookingId,
      });
      return { skipped: true, reason: 'CANCELLED' };
    }

    await tx.booking.update({
      where: { id: params.bookingId },
      data: { status: 'CONFIRMED' },
    });

    await tx.payment.updateMany({
      where: { bookingId: params.bookingId },
      data: {
        stripePaymentIntentId: params.stripePaymentIntentId ?? null,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return { skipped: false };
  });
}
