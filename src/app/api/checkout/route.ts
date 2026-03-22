import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: CheckoutItem[] = body.items;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Le panier est vide.' },
        { status: 400 },
      );
    }

    const stripe = getStripe();

    /* ----------------------------------------------------------
       Fallback mode — no Stripe key configured
       ---------------------------------------------------------- */
    if (!stripe) {
      return NextResponse.json({
        url: '/panier?success=true',
        message:
          'Mode demonstration — aucune cle Stripe configuree. Aucun paiement reel n\'a ete effectue.',
      });
    }

    /* ----------------------------------------------------------
       Create Stripe Checkout Session
       ---------------------------------------------------------- */
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'cad',
      line_items: items.map((item) => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      })),
      success_url: `${origin}/panier?success=true`,
      cancel_url: `${origin}/panier?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[checkout] Error creating session:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session de paiement.' },
      { status: 500 },
    );
  }
}
