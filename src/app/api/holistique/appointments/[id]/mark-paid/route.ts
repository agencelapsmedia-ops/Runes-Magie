import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import { buildBookingEmailData, sendInteracReceivedToClient } from '@/lib/holistic-booking-email';
import { isInternalEmail } from '@/lib/holistic-clients';

/**
 * POST /api/holistique/appointments/[id]/mark-paid
 * Marque un virement Interac comme reçu (admin only). Passe HolisticPayment → PAID.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  // Admin OU praticienne propriétaire (isOwner) — mêmes droits d'administration.
  if (user?.role !== 'ADMIN' && user?.isOwner !== true) {
    return NextResponse.json({ error: 'Action réservée à un admin' }, { status: 403 });
  }

  const { id } = await params;
  const appt = await prisma.holisticAppointment.findUnique({ where: { id }, include: { payment: true } });
  if (!appt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (appt.paymentMode !== 'INTERAC') {
    return NextResponse.json({ error: 'Action réservée aux virements Interac' }, { status: 400 });
  }
  if (appt.payment?.status === 'PAID') {
    return NextResponse.json({ error: 'Ce paiement est déjà réglé' }, { status: 400 });
  }

  await prisma.holisticPayment.update({
    where: { appointmentId: id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  await prisma.holisticAppointment.update({ where: { id }, data: { depositPaidAt: new Date() } });

  // Confirmation au client : virement reçu → RDV confirmé (best-effort, non-bloquant).
  try {
    const emailData = await buildBookingEmailData(id);
    if (emailData && !isInternalEmail(emailData.clientEmail)) {
      await sendInteracReceivedToClient(emailData);
    }
  } catch (err) {
    console.error('[mark-paid] courriel Interac reçu échoué (non-bloquant)', { appointmentId: id, err });
  }

  return NextResponse.json({ ok: true });
}
