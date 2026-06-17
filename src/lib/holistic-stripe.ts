/**
 * Création d'un lien de paiement Stripe (montant complet, sans acompte) pour un RDV manuel.
 * Réutilise le webhook holistique existant via metadata.appointmentId. Best-effort côté caller.
 *
 * Limite Stripe Checkout : la session expire après 24 h (défaut). Pour un lien plus durable,
 * voir Stripe Payment Links (hors périmètre).
 */
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

export async function createHolisticPaymentLink(params: {
  appointmentId: string;
  v2BookingId?: string | null;
  practitioner: { stripeAccountId: string | null; stripeAccountReady: boolean; commissionPct: number };
  amountCad: number;
  productName: string;
  description: string;
  returnBase: string;
}): Promise<string | null> {
  const { appointmentId, v2BookingId, practitioner, amountCad, productName, description, returnBase } = params;
  const usesStripeConnect = !!(practitioner.stripeAccountId && practitioner.stripeAccountReady);
  const commissionRate = (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutParams: any = {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: { name: productName, description },
          unit_amount: Math.round(amountCad * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId,
      amountTotalCad: amountCad.toFixed(2),
      usesDeposit: 'false', // paiement complet → webhook marque HolisticPayment PAID
      payoutMode: usesStripeConnect ? 'auto-split' : 'manual',
      ...(v2BookingId ? { v2BookingId } : {}),
    },
    success_url: `${returnBase}/soins/reservation-confirmee?appointment=${appointmentId}`,
    cancel_url: `${returnBase}/soins/dashboard/client`,
    mode: 'payment',
  };

  if (usesStripeConnect) {
    const commissionOnThisCharge = amountCad * commissionRate;
    checkoutParams.payment_intent_data = {
      application_fee_amount: Math.round(commissionOnThisCharge * 100),
      transfer_data: { destination: practitioner.stripeAccountId },
    };
  }

  const session = await stripe.checkout.sessions.create(checkoutParams);
  return session.url;
}
