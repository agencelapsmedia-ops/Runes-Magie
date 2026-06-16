import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { syncAppointmentStatusToV2, updateBookingTimesV2 } from '@/lib/holistic-v2-sync';
import {
  deleteCalendarEventForAppointment,
  updateCalendarEventForAppointment,
} from '@/lib/google-calendar';
import {
  buildBookingEmailData,
  sendCancellationToClient,
  sendCancellationToPractitioner,
  sendRescheduleToClient,
} from '@/lib/holistic-booking-email';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  const role = (session.user as any).role;

  const appointment = await prisma.holisticAppointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const updated = await prisma.holisticAppointment.update({
    where: { id },
    data: {
      status,
      ...(status === 'CANCELLED' ? { cancelledAt: new Date(), cancelledBy: role } : {}),
    },
  });

  // Dual-write V2 (best-effort)
  try {
    await syncAppointmentStatusToV2({ appointmentId: id, status, cancelledBy: role });
  } catch (err) {
    console.error('[v2-sync] syncAppointmentStatusToV2 failed', { appointmentId: id, err });
  }

  // Annulation → courriels aux deux parties + retrait de l'événement agenda Google
  // (best-effort, no-op si non connectée / Resend non configuré).
  if (status === 'CANCELLED') {
    try {
      const emailData = await buildBookingEmailData(id);
      if (emailData) {
        await Promise.allSettled([
          sendCancellationToClient(emailData),
          sendCancellationToPractitioner(emailData),
        ]);
      }
    } catch (err) {
      console.error('[annulation] envoi courriels échoué (non-bloquant)', { appointmentId: id, err });
    }
    try {
      await deleteCalendarEventForAppointment(id);
    } catch (err) {
      console.error('[google calendar] suppression événement à l\'annulation échouée (non-bloquant)', {
        appointmentId: id,
        err,
      });
    }
  }

  return NextResponse.json(updated);
}

/**
 * PATCH — déplace un RDV confirmé (nouvelle date/heure).
 * Autorisé : la praticienne propriétaire du RDV, ou un admin.
 * Body : { startsAt: string ISO, endsAt?: string ISO } (endsAt recalculé si absent).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const startsAtRaw = body?.startsAt;
  if (!startsAtRaw) return NextResponse.json({ error: 'startsAt requis' }, { status: 400 });

  const appointment = await prisma.holisticAppointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Auth : admin OU praticienne propriétaire
  const isAdmin = user.role === 'ADMIN';
  const isOwner = user.role === 'PRACTITIONER' && user.practitionerId === appointment.practitionerId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Action réservée à la praticienne ou à un admin' }, { status: 403 });
  }

  if (appointment.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'Seul un RDV confirmé peut être déplacé' }, { status: 400 });
  }

  const oldStartsAt = appointment.startsAt;
  const durationMs = appointment.endsAt.getTime() - appointment.startsAt.getTime();
  const newStartsAt = new Date(startsAtRaw);
  const newEndsAt = body?.endsAt ? new Date(body.endsAt) : new Date(newStartsAt.getTime() + durationMs);

  if (Number.isNaN(newStartsAt.getTime()) || Number.isNaN(newEndsAt.getTime())) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  }
  if (newStartsAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'La nouvelle date doit être dans le futur' }, { status: 400 });
  }

  // Conflit avec un autre RDV non annulé de la même praticienne (exclure le RDV courant)
  const conflict = await prisma.holisticAppointment.findFirst({
    where: {
      id: { not: id },
      practitionerId: appointment.practitionerId,
      status: { not: 'CANCELLED' },
      startsAt: { lt: newEndsAt },
      endsAt: { gt: newStartsAt },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: 'Ce créneau chevauche un autre rendez-vous' }, { status: 409 });
  }

  const updated = await prisma.holisticAppointment.update({
    where: { id },
    data: {
      startsAt: newStartsAt,
      endsAt: newEndsAt,
      reminder3dSentAt: null,
      reminder24hSentAt: null,
    },
  });

  // Effets de bord best-effort (ne bloquent jamais la réponse)
  try {
    await updateCalendarEventForAppointment(id);
  } catch (err) {
    console.error('[deplacement] maj agenda Google échouée (non-bloquant)', { appointmentId: id, err });
  }
  try {
    const emailData = await buildBookingEmailData(id);
    if (emailData) await sendRescheduleToClient(emailData);
  } catch (err) {
    console.error('[deplacement] courriel client échoué (non-bloquant)', { appointmentId: id, err });
  }
  try {
    await updateBookingTimesV2({ appointmentId: id, oldStartsAt, newStartsAt, newEndsAt });
  } catch (err) {
    console.error('[v2-sync] updateBookingTimesV2 échoué (non-bloquant)', { appointmentId: id, err });
  }

  return NextResponse.json(updated);
}
