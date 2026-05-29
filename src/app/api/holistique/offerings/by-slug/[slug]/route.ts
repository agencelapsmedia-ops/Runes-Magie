import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/holistique/offerings/by-slug/[slug]
 * Retourne une Offering active par son slug, avec praticienne primaire + co-providers.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const offering = await prisma.offering.findUnique({
    where: { slug },
    include: {
      practitioner: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      providers: {
        include: {
          practitioner: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });

  if (!offering || !offering.isActive) {
    return NextResponse.json({ error: 'Service introuvable.' }, { status: 404 });
  }

  return NextResponse.json({
    id: offering.id,
    slug: offering.slug,
    name: offering.name,
    description: offering.description,
    longDescription: offering.longDescription,
    type: offering.type,
    durationMinutes: offering.durationMinutes,
    price: offering.price,
    priceForTwo: offering.priceForTwo,
    pricePackage: offering.pricePackage,
    pricePackageMsrp: offering.pricePackageMsrp,
    numSessions: offering.numSessions,
    modes: offering.modes,
    capacity: offering.capacity,
    emoji: offering.emoji,
    primaryPractitionerId: offering.practitioner.id,
    primaryPractitionerName: `${offering.practitioner.user.firstName} ${offering.practitioner.user.lastName}`.trim(),
    primaryPractitionerSlug: offering.practitioner.slug,
    additionalProviders: offering.providers.map((p) => ({
      practitionerId: p.practitioner.id,
      practitionerSlug: p.practitioner.slug,
      name: `${p.practitioner.user.firstName} ${p.practitioner.user.lastName}`.trim(),
    })),
  });
}
