import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const practitioners = await prisma.practitioner.findMany({
      where: { status: 'APPROVED' },
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
          select: { rating: true },
        },
      },
    });

    // Calculer la moyenne des avis et formater la réponse
    const formatted = practitioners
      .map((p) => {
        const approvedReviews = p.reviews;
        const reviewCount = approvedReviews.length;
        const avgRating =
          reviewCount > 0
            ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

        return {
          id: p.id,
          slug: p.slug,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          bio: p.bio,
          specialties: p.specialties,
          hourlyRate: p.hourlyRate,
          photoUrl: p.photoUrl,
          yearsExperience: p.yearsExperience,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[holistic/practitioners] Erreur:', error);
    return NextResponse.json(
      { error: 'Impossible de récupérer la liste des praticiens.' },
      { status: 500 }
    );
  }
}
