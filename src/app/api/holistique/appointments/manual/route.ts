import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import { findOrCreateHolisticClient, isInternalEmail } from '@/lib/holistic-clients';
import { signSetPasswordToken } from '@/lib/holistic-password-token';
import { createHolisticPaymentLink } from '@/lib/holistic-stripe';
import { createDailyRoomForAppointment } from '@/lib/daily-co';
import { createCalendarEventForAppointment, getBusyPeriods } from '@/lib/google-calendar';
import { mirrorAppointmentToBooking, mirrorPaymentToV2 } from '@/lib/holistic-v2-sync';
import {
  buildBookingEmailData,
  sendSetPasswordEmail,
  sendManualCashConfirmationToClient,
  sendPaymentLinkToClient,
  sendInteracInstructionsToClient,
  sendManualNotificationToPractitioner,
} from '@/lib/holistic-booking-email';

/** Domaine de retour Stripe : origine de la requête si runesetmagie/vercel, sinon APP_URL. */
function getReturnBase(req: Request): string {
  const origin = (req.headers.get('origin') ?? '').trim();
  if (/^https:\/\/([a-z0-9-]+\.)*(runesetmagie\.ca|vercel\.app)$/i.test(origin)) return origin;
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca').trim();
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
    const session = await holisticSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { practitionerId, client, offeringId, startsAt, mode, paymentMode, notes } = body ?? {};

    // Auth : admin (n'importe quelle praticienne) OU praticienne (elle-même uniquement)
    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.role === 'PRACTITIONER' && user.practitionerId === practitionerId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Action réservée à la praticienne ou à un admin' }, { status: 403 });
    }

    // Validation de base
    if (!practitionerId || !offeringId || !startsAt || !client?.firstName || !client?.lastName || !client?.phone) {
      return NextResponse.json({ error: 'Champs requis manquants (cliente, soin, date).' }, { status: 400 });
    }
    const modeValue: 'IN_PERSON' | 'VIRTUAL' = mode === 'VIRTUAL' ? 'VIRTUAL' : 'IN_PERSON';
    const payment: 'CASH' | 'STRIPE_LINK' | 'INTERAC' | null =
      paymentMode === 'CASH' || paymentMode === 'STRIPE_LINK' || paymentMode === 'INTERAC' ? paymentMode : null;
    if (!payment) return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 });

    const email = typeof client.email === 'string' ? client.email.trim() : '';
    if (!email && payment !== 'CASH') {
      return NextResponse.json(
        { error: 'Un courriel est requis pour le paiement par lien Stripe ou par virement.' },
        { status: 400 },
      );
    }

    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!practitioner) return NextResponse.json({ error: 'Praticienne introuvable' }, { status: 404 });

    const offering = await prisma.offering.findUnique({ where: { id: offeringId } });
    if (!offering || offering.practitionerId !== practitionerId) {
      return NextResponse.json({ error: 'Soin introuvable pour cette praticienne' }, { status: 404 });
    }

    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    if (start.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 });
    }
    const end = new Date(start.getTime() + offering.durationMinutes * 60 * 1000);

    // Conflit avec un RDV non annulé de la praticienne (chevauchement)
    const conflict = await prisma.holisticAppointment.findFirst({
      where: {
        practitionerId,
        status: { not: 'CANCELLED' },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: 'Ce créneau chevauche un autre rendez-vous.' }, { status: 409 });
    }

    // Conflit avec l'agenda Google (best-effort — ignoré si non connectée)
    try {
      const busy = await getBusyPeriods(practitionerId, start, end);
      const overlaps = busy.some((b) => new Date(b.start) < end && new Date(b.end) > start);
      if (overlaps) {
        return NextResponse.json(
          { error: 'Ce créneau est occupé dans l\'agenda Google de la praticienne.' },
          { status: 409 },
        );
      }
    } catch (err) {
      console.error('[rdv manuel] vérif Google free/busy échouée (non-bloquant)', err);
    }

    // Retrouve ou crée le compte cliente
    const { user: clientUser, created } = await findOrCreateHolisticClient({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: email || null,
    });

    // Notes enrichies (même format que le parcours public → parsé par buildBookingEmailData / Google)
    const enrichedNotes = [
      `Service : ${offering.name}`,
      `Mode : ${modeValue === 'IN_PERSON' ? 'Présentiel' : 'Virtuel (vidéo)'}`,
      typeof notes === 'string' && notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join('\n');

    const amountTotal = offering.price;
    const commissionRate = (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;
    const amountCommission = amountTotal * commissionRate;
    const amountPractitioner = amountTotal - amountCommission;

    // RDV créé CONFIRMED → créneau bloqué immédiatement
    const appointment = await prisma.holisticAppointment.create({
      data: {
        clientId: clientUser.id,
        practitionerId,
        startsAt: start,
        endsAt: end,
        status: 'CONFIRMED',
        notes: enrichedNotes,
        paymentMode: payment,
        totalAmount: amountTotal,
        ...(payment === 'CASH' ? { depositPaidAt: new Date() } : {}),
      },
    });

    // Paiement : PAID pour comptant (réglé), PENDING pour Stripe/Interac
    await prisma.holisticPayment.create({
      data: {
        appointmentId: appointment.id,
        amountTotal,
        amountCommission,
        amountPractitioner,
        status: payment === 'CASH' ? 'PAID' : 'PENDING',
        paidAt: payment === 'CASH' ? new Date() : null,
      },
    });

    // Salle Daily si virtuel (best-effort)
    if (modeValue === 'VIRTUAL') {
      try {
        await createDailyRoomForAppointment({ appointmentId: appointment.id, endsAt: end });
      } catch (err) {
        console.error('[rdv manuel] création salle Daily échouée (non-bloquant)', err);
      }
    }

    // Événement Google (best-effort) — le créneau apparaît tout de suite chez la praticienne
    try {
      await createCalendarEventForAppointment(appointment.id);
    } catch (err) {
      console.error('[rdv manuel] création événement Google échouée (non-bloquant)', err);
    }

    // Sync V2 (best-effort)
    let v2BookingId: string | null = null;
    try {
      const booking = await mirrorAppointmentToBooking({ appointment, noStripeFlow: true });
      v2BookingId = booking?.id ?? null;
      if (booking) {
        await mirrorPaymentToV2({
          bookingId: booking.id,
          amountTotal,
          amountCommission,
          amountPractitioner,
          commissionPct: commissionRate * 100,
          status: payment === 'CASH' ? 'PAID' : 'PENDING',
        });
      }
    } catch (err) {
      console.error('[rdv manuel] sync V2 échouée (non-bloquant)', err);
    }

    // Lien Stripe si demandé
    let paymentLink: string | null = null;
    if (payment === 'STRIPE_LINK') {
      try {
        paymentLink = await createHolisticPaymentLink({
          appointmentId: appointment.id,
          v2BookingId,
          practitioner: {
            stripeAccountId: practitioner.stripeAccountId,
            stripeAccountReady: practitioner.stripeAccountReady,
            commissionPct: practitioner.commissionPct,
          },
          amountCad: amountTotal,
          productName: `${offering.name} — ${practitioner.user.firstName} ${practitioner.user.lastName}`.trim(),
          description: `Séance du ${start.toLocaleDateString('fr-CA')}`,
          returnBase: getReturnBase(req),
        });
      } catch (err) {
        console.error('[rdv manuel] création lien Stripe échouée (non-bloquant)', err);
      }
    }

    // Courriels (best-effort) — jamais aux comptes internes
    try {
      const data = await buildBookingEmailData(appointment.id);
      if (data) {
        if (!isInternalEmail(data.clientEmail)) {
          if (created) {
            const token = signSetPasswordToken({ id: clientUser.id, hashedPassword: clientUser.hashedPassword });
            await sendSetPasswordEmail(data, token);
          }
          if (payment === 'CASH' && !created) await sendManualCashConfirmationToClient(data);
          if (payment === 'STRIPE_LINK' && paymentLink) await sendPaymentLinkToClient(data, paymentLink);
          if (payment === 'INTERAC') await sendInteracInstructionsToClient(data);
        }
        // Notif praticienne uniquement si l'admin a créé le RDV pour elle
        if (isAdmin) {
          await sendManualNotificationToPractitioner(data, client.phone, payment);
        }
      }
    } catch (err) {
      console.error('[rdv manuel] envoi courriels échoué (non-bloquant)', err);
    }

    return NextResponse.json({ appointmentId: appointment.id, paymentMode: payment, paymentLink }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    console.error('[POST /api/holistique/appointments/manual] error', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: e?.message ?? 'Erreur lors de la création du rendez-vous.' }, { status: 500 });
  }
}
