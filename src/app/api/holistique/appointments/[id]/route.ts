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
  sendRescheduleToPractitioner,
} from '@/lib/holistic-booking-email';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const role = user.role;

  // Statut : liste blanche stricte (colonne texte comparée strictement partout).
  const STATUTS_VALIDES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
  if (!STATUTS_VALIDES.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const appointment = await prisma.holisticAppointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Autorisation : la cliente du RDV, la praticienne du RDV, ou un admin/propriétaire.
  // (Sans cette garde, n'importe quel compte connecté pouvait changer le RDV d'un tiers.)
  const isAdmin = role === 'ADMIN' || user.isOwner === true;
  const isClientOfAppt = role === 'CLIENT' && appointment.clientId === user.id;
  const isPractitionerOfAppt = role === 'PRACTITIONER' && user.practitionerId === appointment.practitionerId;
  if (!isAdmin && !isClientOfAppt && !isPractitionerOfAppt) {
    return NextResponse.json({ error: 'Action non autorisée sur ce rendez-vous' }, { status: 403 });
  }

  // Une annulation n'est permise que depuis PENDING/CONFIRMED : un RDV déjà
  // complété (séance livrée) ou déjà annulé ne s'annule pas.
  if (status === 'CANCELLED' && !['PENDING', 'CONFIRMED'].includes(appointment.status)) {
    return NextResponse.json({ error: 'Ce rendez-vous ne peut plus être annulé.' }, { status: 400 });
  }

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

  // Annulation d'une rencontre payée avec un jeton de formation → remboursement
  // automatique du jeton (une seule fois). Pour un no-show, Noctura peut ensuite
  // retirer le jeton via « Ajuster la banque » dans la fiche élève.
  if (status === 'CANCELLED' && appointment.paymentMode === 'FORMATION_CREDIT') {
    try {
      const use = await prisma.formationCreditTransaction.findUnique({ where: { appointmentId: id } });
      if (use && use.delta < 0 && use.clientId) {
        // L'unicité de refundOfAppointmentId (contrainte BASE) garantit un seul
        // remboursement par RDV, même sous deux annulations concurrentes : la
        // deuxième insertion échoue en P2002 et est ignorée.
        try {
          await prisma.$transaction([
            prisma.formationCreditTransaction.create({
              data: {
                clientId: use.clientId,
                enrollmentId: use.enrollmentId,
                delta: 1,
                type: 'REFUND',
                reason: `Annulation de la rencontre ${id}`,
                createdBy: 'SYSTEM',
                refundOfAppointmentId: id,
              },
            }),
            ...(use.enrollmentId
              ? [prisma.formationAuditLog.create({
                  data: { enrollmentId: use.enrollmentId, actor: 'SYSTEM', action: 'CREDIT_REFUND', detail: '+1 jeton — rencontre annulée' },
                })]
              : []),
          ]);
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((err as any)?.code !== 'P2002') throw err; // déjà remboursé → silencieux
        }
      }
    } catch (err) {
      console.error('[annulation] remboursement du jeton échoué (non-bloquant)', { appointmentId: id, err });
    }
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

  // Auth : admin (ou praticienne propriétaire de la business) OU praticienne du RDV
  const isAdmin = user.role === 'ADMIN' || user.isOwner === true;
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
    if (emailData) {
      await Promise.allSettled([
        sendRescheduleToClient(emailData),
        sendRescheduleToPractitioner(emailData),
      ]);
    }
  } catch (err) {
    console.error('[deplacement] courriels échoués (non-bloquant)', { appointmentId: id, err });
  }
  try {
    await updateBookingTimesV2({ appointmentId: id, oldStartsAt, newStartsAt, newEndsAt });
  } catch (err) {
    console.error('[v2-sync] updateBookingTimesV2 échoué (non-bloquant)', { appointmentId: id, err });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE — efface DÉFINITIVEMENT un rendez-vous et tout ce qui y est rattaché
 * (paiement, reçus, avis, notifications, jeton de formation consommé).
 * Réservé à un admin / à la propriétaire. Sert à nettoyer les tests et les
 * réservations fantômes qui encombrent le panneau « À régler » de Ma journée.
 * Pour une vraie cliente, le geste normal reste l'annulation (PUT
 * status=CANCELLED) : elle garde la trace et prévient les deux parties.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (user?.role !== 'ADMIN' && user?.isOwner !== true) {
    return NextResponse.json({ error: 'Action réservée à un admin' }, { status: 403 });
  }

  const { id } = await params;
  const appt = await prisma.holisticAppointment.findUnique({
    where: { id },
    select: {
      id: true,
      startsAt: true,
      client: { select: { firstName: true, lastName: true } },
    },
  });
  if (!appt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Miroir V2 et agenda Google d'abord : les deux lisent le RDV en base, donc
  // ils doivent tourner tant qu'il existe encore. Best-effort : un échec ici ne
  // doit pas empêcher le ménage demandé.
  try {
    await syncAppointmentStatusToV2({ appointmentId: id, status: 'CANCELLED', cancelledBy: 'ADMIN' });
  } catch (err) {
    console.error('[suppression] sync V2 échouée (non-bloquant)', { appointmentId: id, err });
  }
  try {
    await deleteCalendarEventForAppointment(id);
  } catch (err) {
    console.error('[suppression] retrait de l\'événement Google échoué (non-bloquant)', {
      appointmentId: id,
      err,
    });
  }

  // Tout part dans la même transaction : sans ça les clés étrangères (paiement,
  // avis, notifications) refusent la suppression du RDV.
  const [notifications, recus, jetons] = await prisma.$transaction([
    prisma.holisticNotification.deleteMany({ where: { appointmentId: id } }),
    prisma.receipt.deleteMany({ where: { appointmentId: id } }),
    // Effacer la ligne « USE » rend le jeton à la banque de l'élève (le solde est
    // la somme des delta) ; on retire aussi un éventuel remboursement d'annulation
    // pour ne pas créditer deux fois le même RDV.
    prisma.formationCreditTransaction.deleteMany({
      where: { OR: [{ appointmentId: id }, { refundOfAppointmentId: id }] },
    }),
    prisma.holisticReview.deleteMany({ where: { appointmentId: id } }),
    prisma.holisticPayment.deleteMany({ where: { appointmentId: id } }),
    prisma.holisticAppointment.delete({ where: { id } }),
  ]);

  console.info('[suppression] RDV effacé définitivement', {
    appointmentId: id,
    client: `${appt.client.firstName} ${appt.client.lastName}`,
    startsAt: appt.startsAt.toISOString(),
    par: user?.email ?? user?.id ?? 'inconnu',
    notifications: notifications.count,
    recus: recus.count,
    jetons: jetons.count,
  });

  return NextResponse.json({ ok: true, recusEffaces: recus.count, jetonsRendus: jetons.count });
}
