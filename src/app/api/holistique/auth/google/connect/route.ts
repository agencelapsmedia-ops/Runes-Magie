import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar';
import { encoderEtatGoogle, RETOUR_GOOGLE_DEFAUT } from '@/lib/google-oauth-retour';

export const dynamic = 'force-dynamic';

/**
 * GET /api/holistique/auth/google/connect?retour=/admin/calendrier
 * Redirige la praticienne connectée vers l'écran de consentement Google.
 * `retour` (chemin local, optionnel) : page où revenir après le consentement —
 * le bandeau vit désormais aussi dans l'admin (/admin/calendrier), pas
 * seulement au pupitre praticien.
 */
export async function GET(req: Request) {
  const retour = new URL(req.url).searchParams.get('retour') ?? RETOUR_GOOGLE_DEFAUT;
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
  return NextResponse.redirect(getGoogleAuthUrl(encoderEtatGoogle(practitionerId, retour)));
}
