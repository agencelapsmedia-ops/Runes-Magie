import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req: Request): string | null {
  // Vercel / proxy : récupérer l'IP depuis les headers standards
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? null;
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, consentEmail } = body ?? {};

    // Validation
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: 'Courriel invalide' }, { status: 400 });
    }
    if (!consentEmail) {
      return NextResponse.json(
        { error: 'Le consentement à recevoir l\'infolettre est requis' },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = typeof firstName === 'string' ? firstName.trim() : null;
    const cleanLastName = typeof lastName === 'string' ? lastName.trim() : null;
    const cleanPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    const ip = getClientIp(req);
    const now = new Date();

    // Upsert : si l'email existe déjà, on met à jour (réabo possible si désabo précédemment)
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phone: cleanPhone,
        consentEmail: true,
        consentIp: ip,
        consentedAt: now,
        source: 'infolettre',
      },
      update: {
        // Permet le ré-abonnement après désabo
        firstName: cleanFirstName ?? undefined,
        lastName: cleanLastName ?? undefined,
        phone: cleanPhone ?? undefined,
        consentEmail: true,
        consentIp: ip,
        consentedAt: now,
        unsubscribedAt: null, // clear désabo si réabonnement
      },
    });

    return NextResponse.json({ success: true, id: subscriber.id }, { status: 201 });
  } catch (err) {
    console.error('[infolettre/subscribe] erreur', err);
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez plus tard.' },
      { status: 500 },
    );
  }
}
