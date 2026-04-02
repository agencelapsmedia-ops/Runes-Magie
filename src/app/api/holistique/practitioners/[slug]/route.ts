import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const practitioner = await prisma.practitioner.findFirst({
      where: {
        slug,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            rating: true,
            comment: true,
            submittedAt: true,
            approvedAt: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
        availabilities: {
          where: { isActive: true },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!practitioner) {
      return NextResponse.json(
        { error: 'Praticien introuvable.' },
        { status: 404 }
      );
    }

    // Calculer la moyenne des avis
    const reviewCount = practitioner.reviews.length;
    const avgRating =
      reviewCount > 0
        ? practitioner.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    return NextResponse.json({
      id: practitioner.id,
      slug: practitioner.slug,
      firstName: practitioner.user.firstName,
      lastName: practitioner.user.lastName,
      email: practitioner.user.email,
      bio: practitioner.bio,
      specialties: practitioner.specialties,
      hourlyRate: practitioner.hourlyRate,
      photoUrl: practitioner.photoUrl,
      yearsExperience: practitioner.yearsExperience,
      stripeAccountReady: practitioner.stripeAccountReady,
      certificationUrls: practitioner.certificationUrls,
      approvedAt: practitioner.approvedAt,
      reviews: practitioner.reviews,
      availabilities: practitioner.availabilities,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });
  } catch (error) {
    console.error('[holistic/practitioners/slug] Erreur:', error);
    return NextResponse.json(
      { error: 'Impossible de récupérer le profil du praticien.' },
      { status: 500 }
    );
  }
}
