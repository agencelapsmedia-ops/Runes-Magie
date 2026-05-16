import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/admin/infolettre
 *
 * Ajout manuel d'un abonné par l'admin (ex: inscription papier scannée).
 * Source 'manual' pour distinguer dans les rapports.
 * Idempotent : si l'email existe, met à jour (réabonnement si désabonné).
 */
export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { firstName, lastName, email, phone } = body ?? {};

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Courriel invalide' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanFirstName = typeof firstName === 'string' && firstName.trim() ? firstName.trim() : null;
  const cleanLastName = typeof lastName === 'string' && lastName.trim() ? lastName.trim() : null;
  const cleanPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

  // L'admin signe pour l'abonné — consent considéré donné (l'admin a la responsabilité légale)
  const now = new Date();

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email: cleanEmail },
    create: {
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: cleanPhone,
      consentEmail: true,
      consentIp: null, // pas applicable pour un ajout manuel
      consentedAt: now,
      source: 'manual',
    },
    update: {
      firstName: cleanFirstName ?? undefined,
      lastName: cleanLastName ?? undefined,
      phone: cleanPhone ?? undefined,
      consentEmail: true,
      consentedAt: now,
      unsubscribedAt: null,
    },
  });

  return NextResponse.json({ success: true, subscriber }, { status: 201 });
}
