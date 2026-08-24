import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/moi — la visiteuse est-elle connectée ?
 * Le chat s'en sert pour afficher l'invitation « crée ton compte » plutôt que
 * la zone de saisie quand personne n'est connecté.
 */
export async function GET() {
  try {
    const session = await holisticSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = session?.user as any;
    if (u?.id) {
      return NextResponse.json({ connectee: true, prenom: (u.name as string)?.split(' ')[0] ?? null });
    }
  } catch {
    // pas de session
  }
  return NextResponse.json({ connectee: false, prenom: null });
}
