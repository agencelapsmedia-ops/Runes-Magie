import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/holistique/auth/google/disconnect
 * Déconnecte le Google Agenda de la praticienne (efface le refresh token).
 */
export async function POST() {
  const session = await auth();
  const practitionerId = (session?.user as { practitionerId?: string } | undefined)?.practitionerId;
  if (!practitionerId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  await prisma.practitioner.update({
    where: { id: practitionerId },
    data: {
      googleRefreshToken: null,
      googleCalendarEmail: null,
      googleCalendarConnectedAt: null,
    },
  });
  return NextResponse.json({ ok: true });
}
