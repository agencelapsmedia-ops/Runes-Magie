import { NextResponse } from 'next/server';
import { getActiveOfferingViewBySlug } from '@/lib/offerings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/offerings/[slug] — données publiques légères d'un soin/cours,
 * pour les cartes interactives du chat Noctura ([CARTE:slug]).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offering = await getActiveOfferingViewBySlug(slug);
  if (!offering) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  return NextResponse.json({
    slug: offering.slug,
    name: offering.name,
    description: offering.description,
    priceLabel: offering.priceLabel,
    durationLabel: offering.durationLabel,
    modes: offering.modes,
    practitionerName: offering.practitionerName,
    imageUrl: offering.imageUrl,
    detailHref: offering.detailHref,
    bookingHref: offering.bookingHref,
    isFormation: offering.isFormation,
  });
}
