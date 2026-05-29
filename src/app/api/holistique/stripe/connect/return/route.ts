import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';

/**
 * GET /api/holistique/stripe/connect/return
 * Endpoint vers lequel Stripe redirige la praticienne après l'onboarding.
 *
 * On vérifie le statut de l'account côté Stripe et on met à jour le DB.
 * Puis on redirige vers le dashboard avec un statut.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get('accountId');
  if (!accountId) {
    return NextResponse.redirect(`${APP_URL}/soins/dashboard/praticien?stripe=error`);
  }

  let charges_enabled = false;
  let payouts_enabled = false;
  let details_submitted = false;
  try {
    const account = await stripe.accounts.retrieve(accountId);
    charges_enabled = account.charges_enabled ?? false;
    payouts_enabled = account.payouts_enabled ?? false;
    details_submitted = account.details_submitted ?? false;
  } catch (e) {
    console.error('[stripe-connect-return] retrieve failed', e);
  }

  // Marque le compte prêt si les 3 capacités sont OK
  const ready = charges_enabled && payouts_enabled && details_submitted;
  await prisma.practitioner.updateMany({
    where: { stripeAccountId: accountId },
    data: { stripeAccountReady: ready },
  });

  return NextResponse.redirect(
    `${APP_URL}/soins/dashboard/praticien?stripe=${ready ? 'ok' : 'incomplete'}`,
  );
}
