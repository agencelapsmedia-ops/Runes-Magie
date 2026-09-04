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
 *
 * Plafond : 5 demandes par heure et par adresse, comptées en base (les instances
 * serverless ne partagent pas de mémoire). La demande est enregistrée AVANT de
 * savoir si le compte existe, sinon le plafond lui-même trahirait les adresses
 * connues.
 */
const PLAFOND_PAR_HEURE = 5;
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

  const uneHeure = new Date(Date.now() - 60 * 60 * 1000);
  const demandesRecentes = await prisma.passwordResetRequest.count({
    where: { email, createdAt: { gte: uneHeure } },
  });
  if (demandesRecentes >= PLAFOND_PAR_HEURE) {
    return NextResponse.json(
      { error: 'Trop de demandes pour cette adresse. Réessaie dans une heure.' },
      { status: 429 },
    );
  }
  await prisma.passwordResetRequest.create({ data: { email } });

  // Purge opportuniste : la table ne sert qu'au comptage sur une heure, rien
  // au-delà de 24 h n'a de valeur. Un échec ici ne doit pas bloquer la demande.
  prisma.passwordResetRequest
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    .catch((erreur) => console.error('[auth] purge des demandes de réinitialisation', erreur));

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
