import { NextResponse } from 'next/server';
import { annulerParJeton } from '@/lib/evenements';
import { envoyerConfirmationAnnulation } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const resultat = await annulerParJeton(token);
  if (!resultat) {
    return NextResponse.json({ error: 'Lien d’annulation invalide.' }, { status: 404 });
  }
  const { inscription, dejaAnnulee } = resultat;

  // Idempotence : si l'inscription était déjà annulée, rien n'a changé — on
  // ne réexpédie pas les courriels (sinon un second clic ferait croire à
  // l'administration qu'une place supplémentaire vient de se libérer).
  if (!dejaAnnulee) {
    try {
      await envoyerConfirmationAnnulation({
        prenom: inscription.firstName,
        nom: inscription.lastName,
        courriel: inscription.email,
        titre: inscription.event.title,
        debut: inscription.event.startsAt,
        lieu: inscription.event.location,
        enLigne: inscription.event.isOnline,
        lienEnLigne: inscription.event.onlineUrl,
        aApporter: inscription.event.bringItems,
        jetonAnnulation: inscription.cancelToken,
      });
    } catch (erreur) {
      console.error('[Evenements] Courriel d’annulation echoue :', erreur);
    }
  }

  return NextResponse.json({ ok: true });
}
