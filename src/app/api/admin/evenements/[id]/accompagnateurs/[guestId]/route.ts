import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/evenements/[id]/accompagnateurs/[guestId]
 * Corps : { attendance: 'PRESENT' | 'ABSENT' | null }
 *
 * Pointe une personne amenée par une inscrite. Même convention que le pointage
 * d'une inscription : `null` remet la ligne à « non pointé », ce qui n'est pas
 * la même chose qu'ABSENT.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id, guestId } = await params;

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

  const accompagnateur = await prisma.eventGuest.findUnique({
    where: { id: guestId },
    include: { registration: { select: { eventId: true, status: true } } },
  });
  if (!accompagnateur || accompagnateur.registration.eventId !== id) {
    return NextResponse.json({ error: 'Accompagnateur introuvable.' }, { status: 404 });
  }
  if (accompagnateur.registration.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'Cette inscription est annulée : elle ne peut pas être pointée.' },
      { status: 409 },
    );
  }

  const miseAJour = await prisma.eventGuest.update({
    where: { id: guestId },
    data: { attendance: valeur, attendanceAt: valeur ? new Date() : null },
  });

  return NextResponse.json({ accompagnateur: miseAJour });
}

/**
 * DELETE /api/admin/evenements/[id]/accompagnateurs/[guestId]
 *
 * Retire une personne amenée (elle s'est décommandée). La place est libérée
 * aussitôt : la capacité compte les accompagnateurs.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id, guestId } = await params;

  const accompagnateur = await prisma.eventGuest.findUnique({
    where: { id: guestId },
    include: { registration: { select: { eventId: true } } },
  });
  if (!accompagnateur || accompagnateur.registration.eventId !== id) {
    return NextResponse.json({ error: 'Accompagnateur introuvable.' }, { status: 404 });
  }

  await prisma.eventGuest.delete({ where: { id: guestId } });
  return NextResponse.json({ ok: true });
}
