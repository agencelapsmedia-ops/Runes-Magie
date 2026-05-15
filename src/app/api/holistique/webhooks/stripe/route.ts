import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { markBookingPaidV2 } from '@/lib/holistic-v2-sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET_HOLISTIC!);
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const appointmentId = checkoutSession.metadata?.appointmentId;
    const v2BookingId = checkoutSession.metadata?.v2BookingId;
    if (!appointmentId) return NextResponse.json({ received: true });

    await prisma.holisticAppointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' },
    });

    await prisma.holisticPayment.update({
      where: { appointmentId },
      data: {
        stripePaymentIntentId: checkoutSession.payment_intent as string,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Dual-write V2 (best-effort) — marque Booking V2 + Payment V2 comme payés
    if (v2BookingId) {
      try {
        await markBookingPaidV2({
          bookingId: v2BookingId,
          stripePaymentIntentId: checkoutSession.payment_intent as string | null,
        });
      } catch (err) {
        console.error('[v2-sync] markBookingPaidV2 failed', { v2BookingId, err });
      }
    }
  }

  return NextResponse.json({ received: true });
}
