import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';
import { recomposerNotes } from '@/lib/appointment-notes';
import { updateCalendarEventForAppointment } from '@/lib/google-calendar';

const LONGUEUR_MAX = 2000;

/**
 * PATCH /api/holistique/appointments/[id]/notes
 * Modifie le texte libre de la note d'un rendez-vous, directement depuis le
 * calendrier. L'en-tête « Service : … / Mode : … » est conservé tel quel.
 * Autorisé : admin / propriétaire, ou la praticienne du RDV.
 * Body : { note: string } (chaîne vide = effacer la note).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const note = body?.note;
  if (typeof note !== 'string') {
    return NextResponse.json({ error: 'Note invalide' }, { status: 400 });
  }
  if (note.length > LONGUEUR_MAX) {
    return NextResponse.json({ error: `La note dépasse ${LONGUEUR_MAX} caractères` }, { status: 400 });
  }

  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id },
    select: { id: true, notes: true, practitionerId: true },
  });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const isAdmin = user.role === 'ADMIN' || user.isOwner === true;
  const isPractitionerOfAppt = user.role === 'PRACTITIONER' && user.practitionerId === appointment.practitionerId;
  if (!isAdmin && !isPractitionerOfAppt) {
    return NextResponse.json({ error: 'Action réservée à la praticienne ou à un admin' }, { status: 403 });
  }

  const notes = recomposerNotes(appointment.notes, note);
  await prisma.holisticAppointment.update({ where: { id }, data: { notes } });

  // L'événement Google reprend les notes dans sa description (best-effort).
  try {
    await updateCalendarEventForAppointment(id);
  } catch (err) {
    console.error('[notes] maj agenda Google échouée (non-bloquant)', { appointmentId: id, err });
  }

  return NextResponse.json({ ok: true, notes });
}
