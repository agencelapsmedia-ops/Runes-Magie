import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * POST /api/holistique/appointments/cancel-pending
 * Body : { appointmentId: string }
 *
 * Supprime un HolisticAppointment en statut PENDING (sans paiement).
 * Appelé par la page /soins/reserver quand l'utilisateur revient avec ?cancelled=true
 * après avoir abandonné Stripe Checkout.
 *
 * Sécurité :
 *  - Seul le client qui a créé le RDV peut le supprimer
 *  - Seuls les RDV PENDING sont supprimés (CONFIRMED jamais touchés)
 *  - Si le paiement a été créé (HolisticPayment exists), on supprime aussi
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientId = (session.user as any).id;

  const { appointmentId } = await req.json();
  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId requis.' }, { status: 400 });
  }

  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    // Déjà supprimé ? Ok pas grave
    return NextResponse.json({ success: true, alreadyDeleted: true });
  }

  if (appointment.clientId !== clientId) {
    return NextResponse.json({ error: 'Tu ne peux supprimer que tes propres RDV.' }, { status: 403 });
  }

  if (appointment.status !== 'PENDING') {
    return NextResponse.json({ error: 'Seuls les RDV en attente peuvent être annulés ici.' }, { status: 400 });
  }

  // Supprime le paiement associé en premier (FK constraint)
  await prisma.holisticPayment.deleteMany({ where: { appointmentId } });
  await prisma.holisticAppointment.delete({ where: { id: appointmentId } });

  return NextResponse.json({ success: true });
}
