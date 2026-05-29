import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createDailyRoomForAppointment } from '@/lib/daily-co';

/**
 * POST /api/holistique/video/[appointmentId]
 *
 * Récupère ou crée la salle vidéo Daily.co pour un RDV.
 * Sécurité : seuls le client du RDV et la praticienne associée peuvent y accéder.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUserId = (session.user as any).id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRole = (session.user as any).role;

  const { appointmentId } = await params;
  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
    include: { practitioner: { select: { userId: true } } },
  });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Vérif autorisation : doit être le client OU la praticienne du RDV (ou admin)
  const isClient = appointment.clientId === sessionUserId;
  const isPractitioner = appointment.practitioner.userId === sessionUserId;
  const isAdmin = sessionRole === 'ADMIN';
  if (!isClient && !isPractitioner && !isAdmin) {
    return NextResponse.json({ error: 'Tu ne peux pas accéder à cette salle.' }, { status: 403 });
  }

  if (appointment.status !== 'CONFIRMED' && appointment.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Le RDV doit être confirmé pour accéder à la vidéo.' }, { status: 400 });
  }

  const url = await createDailyRoomForAppointment({
    appointmentId,
    endsAt: appointment.endsAt,
  });

  if (!url) {
    return NextResponse.json(
      { error: 'Daily.co n\'est pas configuré ou a refusé la création de la salle. Contacte l\'administrateur.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ url });
}
