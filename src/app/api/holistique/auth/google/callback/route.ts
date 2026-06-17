import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { exchangeCodeForTokens, syncFutureConfirmedAppointments } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

/**
 * GET /api/holistique/auth/google/callback
 * Callback OAuth Google : échange le code, stocke le refresh token sur la
 * praticienne (identifiée par sa session), puis redirige vers le dashboard.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = new URL('/soins/dashboard/praticien', url.origin);

  const session = await auth();
  const practitionerId = (session?.user as { practitionerId?: string } | undefined)?.practitionerId;
  if (!practitionerId) {
    back.searchParams.set('google', 'error');
    return NextResponse.redirect(back);
  }

  const oauthError = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  if (oauthError || !code) {
    back.searchParams.set('google', oauthError === 'access_denied' ? 'denied' : 'error');
    return NextResponse.redirect(back);
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens) {
    back.searchParams.set('google', 'error');
    return NextResponse.redirect(back);
  }

  await prisma.practitioner.update({
    where: { id: practitionerId },
    data: {
      googleRefreshToken: tokens.refreshToken,
      googleCalendarEmail: tokens.email,
      googleCalendarConnectedAt: new Date(),
    },
  });

  // Rattrapage auto : pousser les RDV futurs déjà confirmés dans l'agenda
  // fraîchement connecté (best-effort, ne bloque pas la redirection).
  await syncFutureConfirmedAppointments(practitionerId);

  back.searchParams.set('google', 'connected');
  return NextResponse.redirect(back);
}
