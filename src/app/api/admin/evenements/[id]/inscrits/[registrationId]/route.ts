import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { envoyerConfirmationAnnulation } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/evenements/[id]/inscrits/[registrationId]
 *
 * Désinscription manuelle par l'administration (ex. sur demande téléphonique).
 * Passe l'inscription à CANCELLED et prévient la personne par courriel.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id, registrationId } = await params;

  const inscription = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: true },
  });
  if (!inscription || inscription.eventId !== id) {
    return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });
  }
  if (inscription.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cette inscription est déjà annulée.' }, { status: 409 });
  }

  const miseAJour = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

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
      note: inscription.note,
      jetonAnnulation: inscription.cancelToken,
    });
  } catch (erreur) {
    // Un échec de courriel ne doit jamais faire échouer la désinscription.
    console.error('[evenements/admin] échec envoi courriel de désinscription', erreur);
  }

  return NextResponse.json({ inscription: miseAJour });
}

/**
 * PATCH /api/admin/evenements/[id]/inscrits/[registrationId]
 * Corps : { attendance: 'PRESENT' | 'ABSENT' | null }
 *
 * Pointe une personne le jour du rituel. `null` remet la ligne à « non pointé »
 * (erreur de clic) — ce n'est pas la même chose qu'ABSENT, qui affirme que la
 * personne n'est pas venue. Le pointage reste possible après coup : les rituels
 * déjà tenus peuvent être renseignés a posteriori.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id, registrationId } = await params;

  let corps: { attendance?: unknown };
  try {
    corps = (await req.json()) as typeof corps;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const valeur = corps.attendance;
  if (valeur !== null && valeur !== 'PRESENT' && valeur !== 'ABSENT') {
    return NextResponse.json(
      { error: "Présence attendue : 'PRESENT', 'ABSENT' ou null." },
      { status: 400 },
    );
  }

  const inscription = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    select: { id: true, eventId: true, status: true },
  });
  if (!inscription || inscription.eventId !== id) {
    return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });
  }
  if (inscription.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'Cette inscription est annulée : elle ne peut pas être pointée.' },
      { status: 409 },
    );
  }

  const miseAJour = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { attendance: valeur, attendanceAt: valeur ? new Date() : null },
  });

  return NextResponse.json({ inscription: miseAJour });
}
