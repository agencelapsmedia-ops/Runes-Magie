import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createDailyRoomForAppointment } from '@/lib/daily-co';

/**
 * Charge un RDV et vérifie que la session courante a le droit d'y accéder.
 * Retourne le RDV + le rôle de l'utilisateur courant, ou une réponse d'erreur.
 */
async function loadAppointmentWithAccess(appointmentId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUserId = (session.user as any).id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRole = (session.user as any).role;

  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      practitioner: {
        include: { user: { select: { firstName: true, lastName: true, id: true } } },
      },
      client: { select: { firstName: true, lastName: true } },
    },
  });
  if (!appointment) {
    return { error: NextResponse.json({ error: 'RDV introuvable' }, { status: 404 }) };
  }

  const isClient = appointment.clientId === sessionUserId;
  const isPractitioner = appointment.practitioner.userId === sessionUserId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = sessionRole === 'ADMIN' || (session.user as any).isOwner === true;
  if (!isClient && !isPractitioner && !isAdmin) {
    return {
      error: NextResponse.json({ error: 'Tu ne peux pas accéder à cette salle.' }, { status: 403 }),
    };
  }

  const myRole: 'client' | 'practitioner' = isPractitioner ? 'practitioner' : 'client';
  return { appointment, myRole };
}

/**
 * GET /api/holistique/video/[appointmentId]
 * Retourne les infos de la consultation (sans créer de salle Daily si elle n'existe pas).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  const result = await loadAppointmentWithAccess(appointmentId);
  if ('error' in result) return result.error;
  const { appointment, myRole } = result;

  return NextResponse.json({
    dailyRoomUrl: appointment.dailyRoomUrl,
    practitionerName: `${appointment.practitioner.user.firstName} ${appointment.practitioner.user.lastName ?? ''}`.trim(),
    clientName: `${appointment.client.firstName} ${appointment.client.lastName ?? ''}`.trim(),
    startsAt: appointment.startsAt.toISOString(),
    myRole,
    status: appointment.status,
    totalAmount: appointment.totalAmount,
    depositAmount: appointment.depositAmount,
    remainingAmount: appointment.remainingAmount,
  });
}

/**
 * POST /api/holistique/video/[appointmentId]
 * Crée la salle Daily.co si elle n'existe pas encore, sinon retourne l'URL existante.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  const result = await loadAppointmentWithAccess(appointmentId);
  if ('error' in result) return result.error;
  const { appointment, myRole } = result;

  if (appointment.status !== 'CONFIRMED' && appointment.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'Le RDV doit être confirmé pour accéder à la vidéo.' },
      { status: 400 },
    );
  }

  const url = await createDailyRoomForAppointment({
    appointmentId,
    endsAt: appointment.endsAt,
  });

  if (!url) {
    return NextResponse.json(
      {
        error: 'Daily.co n\'est pas configuré ou a refusé la création de la salle. Contacte l\'administrateur.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    dailyRoomUrl: url,
    practitionerName: `${appointment.practitioner.user.firstName} ${appointment.practitioner.user.lastName ?? ''}`.trim(),
    clientName: `${appointment.client.firstName} ${appointment.client.lastName ?? ''}`.trim(),
    startsAt: appointment.startsAt.toISOString(),
    myRole,
    status: appointment.status,
    totalAmount: appointment.totalAmount,
    depositAmount: appointment.depositAmount,
    remainingAmount: appointment.remainingAmount,
  });
}
