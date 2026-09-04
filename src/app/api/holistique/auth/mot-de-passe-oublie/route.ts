import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signSetPasswordToken } from '@/lib/holistic-password-token';
import { sendResetPasswordEmail } from '@/lib/holistic-booking-email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/holistique/auth/mot-de-passe-oublie  { email }
 *
 * Envoie un lien de réinitialisation. La réponse est TOUJOURS la même, que
 * l'adresse existe ou non : sinon la route dirait publiquement qui a un compte
 * chez nous (énumération de comptes). Le jeton est celui de l'activation —
 * signé sur le hash courant, donc à usage unique et périmé au bout de 7 jours.
 */
export async function POST(req: Request) {
  let corps: { email?: unknown };
  try {
    corps = (await req.json()) as typeof corps;
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof corps.email === 'string' ? corps.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 400 });
  }

  const user = await prisma.holisticUser.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, hashedPassword: true },
  });

  if (user) {
    // Un échec d'envoi ne doit pas transparaître dans la réponse (même raison :
    // ne rien révéler sur l'existence du compte). Il est journalisé côté serveur.
    try {
      const token = signSetPasswordToken({ id: user.id, hashedPassword: user.hashedPassword });
      await sendResetPasswordEmail(user.email, user.firstName, token);
    } catch (erreur) {
      console.error('[auth] échec envoi lien de réinitialisation', erreur);
    }
  }

  return NextResponse.json({ ok: true });
}
