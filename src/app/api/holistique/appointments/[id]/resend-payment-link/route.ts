import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import { createHolisticPaymentLink } from '@/lib/holistic-stripe';
import { buildBookingEmailData, sendPaymentChoiceToClient } from '@/lib/holistic-booking-email';
import { isInternalEmail } from '@/lib/holistic-clients';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';

/**
 * POST /api/holistique/appointments/[id]/resend-payment-link
 * Régénère une session Stripe Checkout (l'ancienne expire ~24 h) et renvoie le
 * courriel avec le lien de paiement. Réservé admin / praticienne propriétaire.
 * Conditions : paymentMode STRIPE_LINK, paiement encore PENDING, RDV CONFIRMED à venir.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (user?.role !== 'ADMIN' && user?.isOwner !== true) {
    return NextResponse.json({ error: 'Action réservée à un admin' }, { status: 403 });
  }

  const { id } = await params;
  const appt = await prisma.holisticAppointment.findUnique({
    where: { id },
    include: { payment: true, practitioner: true },
  });
  if (!appt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (appt.paymentMode !== 'STRIPE_LINK') {
    return NextResponse.json({ error: 'Action réservée aux RDV avec lien de paiement' }, { status: 400 });
  }
  if (appt.payment?.status === 'PAID') {
    return NextResponse.json({ error: 'Ce paiement est déjà réglé' }, { status: 400 });
  }
  if (appt.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'Seul un RDV confirmé peut recevoir un lien de paiement' }, { status: 400 });
  }
  if (appt.startsAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Ce rendez-vous est déjà passé' }, { status: 400 });
  }

  const emailData = await buildBookingEmailData(id);
  if (!emailData) return NextResponse.json({ error: 'Données du RDV introuvables' }, { status: 404 });
  if (isInternalEmail(emailData.clientEmail)) {
    return NextResponse.json({ error: 'Ce client n\'a pas de courriel — impossible d\'envoyer un lien' }, { status: 400 });
  }

  const amountCad = appt.totalAmount ?? 0;
  if (amountCad <= 0) {
    return NextResponse.json({ error: 'Montant du RDV invalide' }, { status: 400 });
  }

  // Nouvelle session Checkout : mêmes metadata → le webhook existant confirmera le paiement.
  let paymentLink: string | null = null;
  try {
    paymentLink = await createHolisticPaymentLink({
      appointmentId: id,
      practitioner: {
        stripeAccountId: appt.practitioner.stripeAccountId,
        stripeAccountReady: appt.practitioner.stripeAccountReady,
        commissionPct: appt.practitioner.commissionPct,
      },
      amountCad,
      productName: emailData.serviceName,
      description: `Rendez-vous du ${appt.startsAt.toLocaleDateString('fr-CA', { timeZone: 'America/Toronto' })}`,
      returnBase: APP_URL,
    });
  } catch (err) {
    console.error('[resend-payment-link] création session Stripe échouée', { appointmentId: id, err });
  }
  if (!paymentLink) {
    return NextResponse.json({ error: 'Impossible de générer le lien de paiement' }, { status: 502 });
  }

  await sendPaymentChoiceToClient(emailData, paymentLink);

  return NextResponse.json({ ok: true, paymentLink });
}
