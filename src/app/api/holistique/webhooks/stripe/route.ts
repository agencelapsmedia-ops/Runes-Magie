import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { markBookingPaidV2 } from '@/lib/holistic-v2-sync';
import { createDailyRoomForAppointment } from '@/lib/daily-co';
import { createCalendarEventForAppointment } from '@/lib/google-calendar';
import {
  buildBookingEmailData,
  sendBookingConfirmationToClient,
  sendBookingNotificationToPractitioner,
} from '@/lib/holistic-booking-email';

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

    // Création auto de la salle vidéo Daily.co si le RDV est virtuel
    // (best-effort — si échec, la salle sera créée à la demande quand quelqu'un visite /soins/consultation/[id])
    try {
      const apptForVideo = await prisma.holisticAppointment.findUnique({
        where: { id: appointmentId },
        select: { endsAt: true, notes: true },
      });
      const isVirtual = apptForVideo?.notes?.toLowerCase().includes('virtuel');
      if (apptForVideo && isVirtual) {
        await createDailyRoomForAppointment({
          appointmentId,
          endsAt: apptForVideo.endsAt,
        });
      }
    } catch (err) {
      console.error('[webhook] daily room creation failed (non-blocking)', err);
    }

    // Envoie les emails de confirmation au client et à la praticienne (best-effort).
    // Source unique : buildBookingEmailData (la salle Daily créée ci-dessus est déjà
    // persistée sur le RDV, donc récupérée automatiquement).
    try {
      const emailData = await buildBookingEmailData(appointmentId);
      if (emailData) {
        // Envoi en parallèle (best-effort, n'attend pas la fin pour répondre OK à Stripe)
        await Promise.allSettled([
          sendBookingConfirmationToClient(emailData),
          sendBookingNotificationToPractitioner(emailData),
        ]);
      }
    } catch (err) {
      console.error('[webhook] booking emails failed (non-blocking)', err);
    }

    // Sync sortante Google Agenda (best-effort) — crée l'événement dans l'agenda
    // de la praticienne SI elle a connecté son Google Agenda. Aucun impact sinon.
    try {
      await createCalendarEventForAppointment(appointmentId);
    } catch (err) {
      console.error('[webhook] google calendar event creation failed (non-blocking)', err);
    }

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
