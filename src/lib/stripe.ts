import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Returns a lazily-initialized Stripe instance.
 * Returns `null` if `STRIPE_SECRET_KEY` is not set.
 */
export function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn(
      '[Runes & Magie] STRIPE_SECRET_KEY is not set — Stripe checkout will use fallback mode.',
    );
    return null;
  }

  stripeInstance = new Stripe(key, {
    typescript: true,
  });

  return stripeInstance;
}
