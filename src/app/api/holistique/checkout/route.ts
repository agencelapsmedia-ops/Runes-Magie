import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { mirrorAppointmentToBooking, mirrorPaymentToV2 } from '@/lib/holistic-v2-sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

export async function POST(req: Request) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { practitionerId, startsAt, endsAt, notes, offeringId, mode } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientId = (session.user as any).id;

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!practitioner) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 404 });

  // Si une Offering est sélectionnée, utiliser son prix au lieu du hourlyRate du praticien
  let offering = null;
  if (offeringId) {
    offering = await prisma.offering.findUnique({ where: { id: offeringId } });
  }

  // Construit le bloc de notes enrichi avec le service et le mode pour traçabilité
  // (HolisticAppointment legacy n'a pas de champ offeringId/mode)
  const enrichedNotes = [
    offering ? `Service : ${offering.name}` : null,
    mode ? `Mode : ${mode === 'IN_PERSON' ? 'Présentiel' : 'Virtuel (vidéo)'}` : null,
    notes,
  ].filter(Boolean).join('\n') || undefined;

  const durationHours = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (1000 * 60 * 60);
  // Prix : prix de l'Offering si fourni, sinon fallback sur hourlyRate × heures
  const amountTotal = offering ? offering.price : practitioner.hourlyRate * durationHours;
  // Commission : taux par praticien (Practitioner.commissionPct) ou défaut env
  const commissionRate = (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;
  const amountCommission = amountTotal * commissionRate;
  const amountPractitioner = amountTotal - amountCommission;

  // Créer le rdv d'abord
  const appointment = await prisma.holisticAppointment.create({
    data: { clientId, practitionerId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), notes: enrichedNotes, status: 'PENDING' },
  });

  // Créer enregistrement paiement (pour tracker ce qu'on doit reverser au praticien)
  await prisma.holisticPayment.create({
    data: {
      appointmentId: appointment.id,
      amountTotal,
      amountCommission,
      amountPractitioner,
      status: 'PENDING',
    },
  });

  // Dual-write V2 (best-effort) — flow Stripe → V2 = PENDING_PAYMENT
  let v2BookingId: string | null = null;
  try {
    const booking = await mirrorAppointmentToBooking({ appointment });
    v2BookingId = booking?.id ?? null;
    if (booking) {
      await mirrorPaymentToV2({
        bookingId: booking.id,
        amountTotal,
        amountCommission,
        amountPractitioner,
        commissionPct: commissionRate * 100,
        status: 'PENDING',
      });
    }
  } catch (err) {
    console.error('[v2-sync] mirror checkout failed', { appointmentId: appointment.id, err });
  }

  // 2 modes de paiement supportés :
  //  - Stripe Connect prêt : split auto au moment du paiement (65 % praticienne, 35 % plateforme)
  //  - Stripe Connect pas prêt : encaisse tout sur le compte plateforme, redistribution manuelle plus tard
  const usesStripeConnect = !!(practitioner.stripeAccountId && practitioner.stripeAccountReady);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutParams: any = {
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'cad',
        product_data: {
          name: offering
            ? `${offering.name} — ${practitioner.user.firstName} ${practitioner.user.lastName}`
            : `Consultation avec ${practitioner.user.firstName} ${practitioner.user.lastName}`,
          description: `${new Date(startsAt).toLocaleDateString('fr-CA')} — ${durationHours}h${mode ? ` (${mode === 'IN_PERSON' ? 'présentiel' : 'vidéo'})` : ''}`,
        },
        unit_amount: Math.round(amountTotal * 100),
      },
      quantity: 1,
    }],
    metadata: {
      appointmentId: appointment.id,
      practitionerId,
      amountPractitionerCad: amountPractitioner.toFixed(2),
      amountCommissionCad: amountCommission.toFixed(2),
      payoutMode: usesStripeConnect ? 'auto-split' : 'manual',
      ...(v2BookingId ? { v2BookingId } : {}),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/soins/dashboard/client?booking=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/soins/reserver/${practitionerId}?cancelled=true`,
    mode: 'payment',
  };

  if (usesStripeConnect) {
    checkoutParams.payment_intent_data = {
      application_fee_amount: Math.round(amountCommission * 100),
      transfer_data: { destination: practitioner.stripeAccountId },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

  return NextResponse.json({ url: checkoutSession.url });
}
