import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { practitionerId: string } }
) {
  const { practitionerId } = params;

  const practitioner = await prisma.practitioner.findFirst({
    where: {
      id: practitionerId,
      status: 'APPROVED',
    },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      availabilities: {
        where: { isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });

  if (!practitioner) {
    return NextResponse.json({ error: 'Praticien introuvable' }, { status: 404 });
  }

  return NextResponse.json({
    id: practitioner.id,
    slug: practitioner.slug,
    firstName: practitioner.user.firstName,
    lastName: practitioner.user.lastName,
    bio: practitioner.bio,
    specialties: practitioner.specialties,
    hourlyRate: practitioner.hourlyRate,
    photoUrl: practitioner.photoUrl,
    yearsExperience: practitioner.yearsExperience,
    availabilities: practitioner.availabilities,
  });
}
