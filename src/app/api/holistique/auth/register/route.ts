import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? null;
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      isPractitioner,
      specialties,
      yearsExperience,
      hourlyRate,
      bio,
      consentInfolettre,
    } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.holisticUser.findUnique({ where: { email: cleanEmail } });
    if (existing) return NextResponse.json({ error: 'Courriel déjà utilisé' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const cleanPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    const user = await prisma.holisticUser.create({
      data: {
        email: cleanEmail,
        hashedPassword,
        firstName,
        lastName,
        phone: cleanPhone,
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

    // Si la personne a coché "je veux l'infolettre" : créer aussi un NewsletterSubscriber
    // (best-effort : si ça échoue, le compte est quand même créé)
    if (consentInfolettre === true) {
      try {
        const ip = getClientIp(req);
        const now = new Date();
        await prisma.newsletterSubscriber.upsert({
          where: { email: cleanEmail },
          create: {
            email: cleanEmail,
            firstName,
            lastName,
            phone: cleanPhone,
            consentEmail: true,
            consentIp: ip,
            consentedAt: now,
            source: 'register',
          },
          update: {
            firstName,
            lastName,
            phone: cleanPhone ?? undefined,
            consentEmail: true,
            consentIp: ip,
            consentedAt: now,
            unsubscribedAt: null,
          },
        });
      } catch (err) {
        console.error('[register] échec création NewsletterSubscriber', err);
      }
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
