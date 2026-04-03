import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

export async function POST(req: Request) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { practitionerId, startsAt, endsAt, notes } = await req.json();
  const clientId = (session.user as any).id;

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!practitioner) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 404 });
  if (!practitioner.stripeAccountId || !practitioner.stripeAccountReady) {
    // Pas encore Stripe Connect → créer rdv PENDING sans paiement
    const appointment = await prisma.holisticAppointment.create({
      data: { clientId, practitionerId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), notes, status: 'PENDING' },
    });
    return NextResponse.json({ success: true, appointmentId: appointment.id });
  }

  const durationHours = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (1000 * 60 * 60);
  const amountTotal = practitioner.hourlyRate * durationHours;
  const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.35');
  const amountCommission = amountTotal * commissionRate;

  // Créer le rdv d'abord
  const appointment = await prisma.holisticAppointment.create({
    data: { clientId, practitionerId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), notes, status: 'PENDING' },
  });

  // Créer enregistrement paiement
  await prisma.holisticPayment.create({
    data: {
      appointmentId: appointment.id,
      amountTotal,
      amountCommission,
      amountPractitioner: amountTotal - amountCommission,
      status: 'PENDING',
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'cad',
        product_data: {
          name: `Consultation avec ${practitioner.user.firstName} ${practitioner.user.lastName}`,
          description: `${new Date(startsAt).toLocaleDateString('fr-CA')} — ${durationHours}h`,
        },
        unit_amount: Math.round(amountTotal * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: Math.round(amountCommission * 100),
      transfer_data: { destination: practitioner.stripeAccountId },
    },
    metadata: { appointmentId: appointment.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/soins/dashboard/client?booking=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/soins/reserver/${practitionerId}?cancelled=true`,
    mode: 'payment',
  });

  return NextResponse.json({ url: checkoutSession.url });
}
