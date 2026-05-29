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
    const usesDeposit = checkoutSession.metadata?.usesDeposit === 'true';
    if (!appointmentId) return NextResponse.json({ received: true });

    // Récupère le PaymentMethod ID pour pouvoir charger le solde plus tard off-session
    let stripePaymentMethodId: string | null = null;
    let stripeCustomerId: string | null = (checkoutSession.customer as string) ?? null;
    if (usesDeposit && checkoutSession.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          checkoutSession.payment_intent as string,
        );
        stripePaymentMethodId = (paymentIntent.payment_method as string) ?? null;
        if (!stripeCustomerId && paymentIntent.customer) {
          stripeCustomerId = paymentIntent.customer as string;
        }
      } catch (err) {
        console.error('[webhook] failed to retrieve payment intent', err);
      }
    }

    await prisma.holisticAppointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED', // RDV confirmé (acompte ou paiement complet reçu)
        depositPaidAt: new Date(),
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(stripePaymentMethodId ? { stripePaymentMethodId } : {}),
      },
    });

    await prisma.holisticPayment.update({
      where: { appointmentId },
      data: {
        stripePaymentIntentId: checkoutSession.payment_intent as string,
        // Si pas d'acompte (paiement complet à la résa), on marque PAID direct
        // Si acompte, on garde PENDING pour indiquer qu'il manque encore le solde
        status: usesDeposit ? 'PENDING' : 'PAID',
        paidAt: usesDeposit ? null : new Date(),
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
