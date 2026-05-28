import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * GET /api/holistique/auth/me
 * Retourne l'utilisateur connecté (session JWT) ou 401 si non connecté.
 * Utilisé par la page de réservation pour pré-remplir / décider d'afficher le bouton login.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: (session.user as { id?: string }).id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as { role?: string }).role,
      practitionerId: (session.user as { practitionerId?: string }).practitionerId,
      practitionerStatus: (session.user as { practitionerStatus?: string }).practitionerStatus,
    },
  });
}
