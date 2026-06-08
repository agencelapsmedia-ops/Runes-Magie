import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

/**
 * GET /api/holistique/auth/google/connect
 * Redirige la praticienne connectée vers l'écran de consentement Google.
 */
export async function GET() {
  const session = await auth();
  const practitionerId = (session?.user as { practitionerId?: string } | undefined)?.practitionerId;
  if (!practitionerId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Agenda non configuré sur le serveur' },
      { status: 503 },
    );
  }
  return NextResponse.redirect(getGoogleAuthUrl(practitionerId));
}
