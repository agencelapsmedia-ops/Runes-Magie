import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, phone, isPractitioner, specialties, yearsExperience, hourlyRate, bio } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const existing = await prisma.holisticUser.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Courriel déjà utilisé' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.holisticUser.create({
      data: {
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        role: isPractitioner ? 'PRACTITIONER' : 'CLIENT',
      },
    });

    if (isPractitioner) {
      const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`.replace(/[^a-z0-9-]/g, '-');
      await prisma.practitioner.create({
        data: {
          userId: user.id,
          slug,
          status: 'PENDING',
          specialties: specialties || [],
          yearsExperience: yearsExperience || 0,
          hourlyRate: hourlyRate || 80,
          bio: bio || '',
        },
      });
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
