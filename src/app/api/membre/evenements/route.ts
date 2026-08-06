import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { annulerParMembre } from '@/lib/evenements';
import { envoyerConfirmationAnnulation } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  // L'identifiant de session peut appartenir a un AdminUser : on revérifie
  // qu'il s'agit bien d'un membre (meme motif que /api/membre/profil).
  const membre = await prisma.holisticUser.findUnique({ where: { id: userId } });
  if (!membre) {
    return NextResponse.json({ error: 'Compte membre introuvable.' }, { status: 401 });
  }

  const inscriptions = await prisma.eventRegistration.findMany({
    where: { userId, status: 'CONFIRMED' },
    include: { event: true },
    orderBy: { event: { startsAt: 'asc' } },
  });
  return NextResponse.json({ inscriptions });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  // L'identifiant de session peut appartenir a un AdminUser : on revérifie
  // qu'il s'agit bien d'un membre (meme motif que /api/membre/profil).
  const membre = await prisma.holisticUser.findUnique({ where: { id: userId } });
  if (!membre) {
    return NextResponse.json({ error: 'Compte membre introuvable.' }, { status: 401 });
  }

  let registrationId: string | undefined;
  try {
    const corps = (await req.json()) as { registrationId?: string };
    registrationId = corps.registrationId;
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (!registrationId) {
    return NextResponse.json({ error: 'Inscription non précisée.' }, { status: 400 });
  }

  // Récupérée avant l'annulation pour alimenter le courriel de confirmation.
  const inscription = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: true },
  });

  const annulee = await annulerParMembre(registrationId, userId);
  if (!annulee) {
    return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });
  }

  // Un echec d'envoi ne doit pas faire echouer l'annulation elle-meme.
  if (inscription) {
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
