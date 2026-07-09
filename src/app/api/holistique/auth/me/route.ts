import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Jamais mis en cache : l'état de session doit toujours être frais (sinon la
// déconnexion peut « prendre deux clics » à cause d'une réponse en cache).
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

/**
 * GET /api/holistique/auth/me
 * Retourne l'utilisateur connecté (session JWT) ou 401 si non connecté.
 * Utilisé par la page de réservation pour pré-remplir / décider d'afficher le bouton login.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401, headers: NO_STORE });
  }
  return NextResponse.json(
    {
      user: {
        id: (session.user as { id?: string }).id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as { role?: string }).role,
        practitionerId: (session.user as { practitionerId?: string }).practitionerId,
        practitionerStatus: (session.user as { practitionerStatus?: string }).practitionerStatus,
        isOwner: (session.user as { isOwner?: boolean }).isOwner === true,
      },
    },
    { headers: NO_STORE },
  );
}
