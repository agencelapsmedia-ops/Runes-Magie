import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { envoyerMessageAuxInscrits } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/evenements/[id]/message
 * Corps : { sujet, message }
 *
 * Envoie un courriel libre à tous les inscrits confirmés d'un événement
 * (ex. rappel de matériel, changement de lieu de dernière minute).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const corps = (await req.json()) as Record<string, unknown>;
  const sujet = typeof corps.sujet === 'string' ? corps.sujet.trim() : '';
  const message = typeof corps.message === 'string' ? corps.message.trim() : '';

  if (!sujet) return NextResponse.json({ error: 'Le sujet est requis.' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Le message est requis.' }, { status: 400 });

  const evenement = await prisma.event.findUnique({ where: { id } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  const inscrits = await prisma.eventRegistration.findMany({
    where: { eventId: id, status: 'CONFIRMED' },
    select: { email: true },
  });
  const destinataires = inscrits.map((i) => i.email);

  // Un échec d'envoi ne doit jamais faire échouer la requête ; on rapporte le
  // nombre réellement envoyé plutôt que le nombre de destinataires visés.
  let resultat: { envoyes: number; echecs: string[] } = { envoyes: 0, echecs: destinataires };
  try {
    resultat = await envoyerMessageAuxInscrits(destinataires, evenement.title, sujet, message);
  } catch (erreur) {
    console.error('[evenements/admin] échec envoi message aux inscrits', erreur);
  }

  return NextResponse.json({ envoyesA: resultat.envoyes, echecs: resultat.echecs.length });
}
