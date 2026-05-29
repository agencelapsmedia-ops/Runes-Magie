import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';

/**
 * POST /api/holistique/stripe/connect/onboard
 * Lancée par la praticienne depuis son dashboard.
 *
 * Comportement :
 *   1. Crée un compte Stripe Connect Express si elle n'en a pas (sinon réutilise)
 *   2. Génère un AccountLink (URL d'onboarding hébergée par Stripe)
 *   3. Retourne l'URL à laquelle rediriger
 *
 * Stripe gère toute l'UI : KYC, infos bancaires, vérification d'identité.
 * Une fois fini, Stripe redirige vers /soins/dashboard/praticien?stripe=ok.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role;
  if (role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Réservé aux praticien·ne·s.' }, { status: 403 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const practitionerId = (session.user as any).practitionerId as string | null;
  if (!practitionerId) {
    return NextResponse.json({ error: 'Profil praticien introuvable.' }, { status: 404 });
  }

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });
  if (!practitioner) {
    return NextResponse.json({ error: 'Praticien·ne introuvable.' }, { status: 404 });
  }

  // Réutilise l'account existant ou en crée un nouveau
  let stripeAccountId = practitioner.stripeAccountId;

  try {
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA',
        email: practitioner.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '7299', // Other services (incl. spiritual / wellness)
          product_description: `Soins énergétiques et holistiques offerts par ${practitioner.user.firstName} ${practitioner.user.lastName} via Runes & Magie.`,
          url: APP_URL,
        },
        metadata: {
          practitionerId: practitioner.id,
          platform: 'runes-et-magie',
        },
      });

      stripeAccountId = account.id;
      await prisma.practitioner.update({
        where: { id: practitionerId },
        data: { stripeAccountId, stripeAccountReady: false },
      });
    }

    // Génère un AccountLink (URL d'onboarding valide ~1h)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${APP_URL}/soins/dashboard/praticien?stripe=refresh`,
      return_url: `${APP_URL}/api/holistique/stripe/connect/return?accountId=${stripeAccountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    console.error('[stripe-connect-onboard] error:', {
      message: e?.message,
      type: e?.type,
      code: e?.code,
      raw: e?.raw,
    });
    return NextResponse.json(
      {
        error: e?.message ?? 'Erreur lors de la création du compte Stripe.',
        stripeCode: e?.code ?? null,
        stripeType: e?.type ?? null,
      },
      { status: 500 },
    );
  }
}
