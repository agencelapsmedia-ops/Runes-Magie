import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/evenements/[id]/presences
 * Corps : { attendance: 'PRESENT' | 'ABSENT' | null }
 *
 * Pointe d'un coup tous les inscrits confirmés d'un rituel. Sert surtout au cas
 * courant — presque tout le monde est venu : on marque tout le monde présent,
 * puis on corrige les deux ou trois absents à la main.
 *
 * Écrase les pointages déjà faits sur ce rituel : c'est l'effet attendu d'un
 * bouton « tout marquer », et l'écran le dit avant de l'appliquer.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

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

  const evenement = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  const horodatage = valeur ? new Date() : null;
  // Les accompagnateurs sont pointés avec leur hôte : « tout marquer présent »
  // doit vouloir dire tout le monde dans la salle, pas seulement les membres.
  const [inscriptions, accompagnateurs] = await prisma.$transaction([
    prisma.eventRegistration.updateMany({
      where: { eventId: id, status: 'CONFIRMED' },
      data: { attendance: valeur, attendanceAt: horodatage },
    }),
    prisma.eventGuest.updateMany({
      where: { registration: { eventId: id, status: 'CONFIRMED' } },
      data: { attendance: valeur, attendanceAt: horodatage },
    }),
  ]);

  return NextResponse.json({
    pointes: inscriptions.count + accompagnateurs.count,
    inscriptions: inscriptions.count,
    accompagnateurs: accompagnateurs.count,
  });
}
