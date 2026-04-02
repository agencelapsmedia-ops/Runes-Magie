import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await holisticSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { bio, specialties, yearsExperience, hourlyRate } = await req.json();

  const holisticUser = await prisma.holisticUser.findUnique({
    where: { id: userId },
  });

  if (!holisticUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  // Generate base slug from firstName + lastName
  const baseSlug = `${holisticUser.firstName}-${holisticUser.lastName}`
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Check if slug already exists; append 4-char suffix if so
  let slug = baseSlug;
  const existing = await prisma.practitioner.findUnique({ where: { slug } });
  if (existing) {
    const suffix = Math.random().toString(36).slice(2, 6);
    slug = `${baseSlug}-${suffix}`;
  }

  const practitioner = await prisma.practitioner.create({
    data: {
      userId,
      slug,
      bio: bio ?? '',
      specialties: specialties ?? [],
      yearsExperience: yearsExperience ?? 0,
      hourlyRate: hourlyRate ?? 80,
      status: 'PENDING',
    },
  });

  return NextResponse.json({ success: true, slug: practitioner.slug }, { status: 201 });
}
