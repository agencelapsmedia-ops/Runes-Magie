import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { envoyerAnnulationEvenement } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/evenements/[id]/annuler
 * Corps : { motif? }
 *
 * Annule l'événement entier : renseigne `cancelledAt`, passe toutes les
 * inscriptions confirmées à CANCELLED, puis prévient les inscrits.
 *
 * Les courriels des inscrits sont récupérés AVANT de passer leurs
 * inscriptions à CANCELLED, sinon plus personne à prévenir.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const corps = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const motif = typeof corps.motif === 'string' && corps.motif.trim() ? corps.motif.trim() : null;

  const evenement = await prisma.event.findUnique({ where: { id } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }
  if (evenement.cancelledAt) {
    return NextResponse.json({ error: 'Cet événement est déjà annulé.' }, { status: 409 });
  }

  // Récupération des courriels AVANT le passage en CANCELLED.
  const inscrits = await prisma.eventRegistration.findMany({
    where: { eventId: id, status: 'CONFIRMED' },
    select: { email: true },
  });
  const destinataires = inscrits.map((i) => i.email);

  const maintenant = new Date();
  const [evenementAnnule] = await prisma.$transaction([
    prisma.event.update({ where: { id }, data: { cancelledAt: maintenant } }),
    prisma.eventRegistration.updateMany({
      where: { eventId: id, status: 'CONFIRMED' },
      data: { status: 'CANCELLED', cancelledAt: maintenant },
    }),
  ]);

  // Un échec d'envoi ne doit jamais faire échouer l'annulation ; on rapporte le
  // nombre réellement envoyé plutôt que le nombre de destinataires visés.
  let resultat: { envoyes: number; echecs: string[] } = { envoyes: 0, echecs: destinataires };
  try {
    resultat = await envoyerAnnulationEvenement(destinataires, evenement.title, evenement.startsAt, motif);
  } catch (erreur) {
    console.error('[evenements/admin] échec envoi courriel d\'annulation de l\'événement', erreur);
  }

  return NextResponse.json({
    evenement: evenementAnnule,
    envoyesA: resultat.envoyes,
    echecs: resultat.echecs.length,
  });
}
