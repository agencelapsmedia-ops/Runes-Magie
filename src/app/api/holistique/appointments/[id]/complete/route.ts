import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

/**
 * POST /api/holistique/appointments/[id]/complete
 *
 * Appelé par la praticienne à la fin de la séance.
 *
 * Body : { outcome: 'CHARGED' | 'GIFTED' | 'NO_SHOW' }
 *
 * - CHARGED   : charge le solde (remainingAmount) sur la carte sauvegardée et termine la séance
 * - GIFTED    : ne charge rien, marque la séance comme offerte par la praticienne
 * - NO_SHOW   : ne charge rien, marque le client comme absent (l'acompte 25 $ reste acquis)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRole = (session.user as any).role;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUserId = (session.user as any).id;
  if (sessionRole !== 'PRACTITIONER' && sessionRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Réservé aux praticien·ne·s.' }, { status: 403 });
  }

  const { id: appointmentId } = await params;
  const { outcome } = await req.json();

  if (!['CHARGED', 'GIFTED', 'NO_SHOW'].includes(outcome)) {
    return NextResponse.json({ error: 'Outcome invalide.' }, { status: 400 });
  }

  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      practitioner: { include: { user: true } },
      client: { select: { firstName: true, lastName: true, email: true } },
      payment: true,
    },
  });
  if (!appointment) {
    return NextResponse.json({ error: 'RDV introuvable.' }, { status: 404 });
  }

  // Vérification d'autorisation : la praticienne ne peut terminer que SES RDV
  if (sessionRole === 'PRACTITIONER' && appointment.practitioner.userId !== sessionUserId) {
    return NextResponse.json({ error: 'Tu ne peux terminer que tes propres RDV.' }, { status: 403 });
  }

  if (appointment.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Ce RDV est déjà terminé.' }, { status: 400 });
  }
  if (appointment.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Impossible de terminer un RDV annulé.' }, { status: 400 });
  }

  // Cas 1 : CHARGED — facturer le solde sur la carte sauvegardée
  if (outcome === 'CHARGED') {
    const remainingAmount = appointment.remainingAmount ?? 0;

    // Si pas de solde à charger (paiement complet à la résa), juste finir
    if (remainingAmount <= 0) {
      await prisma.holisticAppointment.update({
        where: { id: appointmentId },
        data: {
          status: 'COMPLETED',
          completionOutcome: 'CHARGED',
        },
      });
      // Le HolisticPayment était déjà PAID lors du checkout (cas groupe sans acompte)
      return NextResponse.json({ success: true, charged: 0 });
    }

    if (!appointment.stripePaymentMethodId || !appointment.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Impossible de charger : aucune carte sauvegardée pour ce RDV.' },
        { status: 400 },
      );
    }

    // Calcule le split pour Stripe Connect si applicable
    const practitioner = appointment.practitioner;
    const usesStripeConnect = !!(practitioner.stripeAccountId && practitioner.stripeAccountReady);
    const commissionRate =
      (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;
    const commissionOnRemainder = remainingAmount * commissionRate;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentIntentParams: any = {
        amount: Math.round(remainingAmount * 100),
        currency: 'cad',
        customer: appointment.stripeCustomerId,
        payment_method: appointment.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `Solde de séance — ${practitioner.user.firstName} ${practitioner.user.lastName}`.trim(),
        metadata: {
          appointmentId: appointment.id,
          chargeType: 'remainder',
          practitionerId: practitioner.id,
        },
      };

      if (usesStripeConnect) {
        paymentIntentParams.application_fee_amount = Math.round(commissionOnRemainder * 100);
        paymentIntentParams.transfer_data = { destination: practitioner.stripeAccountId };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      // Met à jour le RDV
      await prisma.holisticAppointment.update({
        where: { id: appointmentId },
        data: {
          status: 'COMPLETED',
          completionOutcome: 'CHARGED',
          remainderChargedAt: new Date(),
          remainderPaymentIntentId: paymentIntent.id,
        },
      });

      // Marque le paiement comme PAID puisque la totalité est maintenant encaissée
      await prisma.holisticPayment.update({
        where: { appointmentId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        charged: remainingAmount,
        paymentIntentId: paymentIntent.id,
      });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      console.error('[complete-appointment] Stripe charge failed:', {
        appointmentId,
        message: e?.message,
        code: e?.code,
        decline_code: e?.decline_code,
      });
      return NextResponse.json(
        {
          error:
            e?.code === 'authentication_required'
              ? 'La carte du client nécessite une authentification supplémentaire. Contacte-le pour qu\'il finalise le paiement.'
              : e?.code === 'card_declined'
                ? `Carte refusée (${e?.decline_code ?? 'raison inconnue'}). Contacte le client pour qu'il mette sa carte à jour.`
                : (e?.message ?? 'Erreur lors du prélèvement du solde.'),
          stripeCode: e?.code,
        },
        { status: 402 },
      );
    }
  }

  // Cas 2 : GIFTED — séance offerte par la praticienne (pas de charge supplémentaire)
  if (outcome === 'GIFTED') {
    await prisma.holisticAppointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        completionOutcome: 'GIFTED',
      },
    });
    // Le paiement de l'acompte (s'il y en a un) est conservé en l'état
    return NextResponse.json({ success: true, charged: 0, outcome: 'GIFTED' });
  }

  // Cas 3 : NO_SHOW — client absent, l'acompte reste comme pénalité
  if (outcome === 'NO_SHOW') {
    await prisma.holisticAppointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        completionOutcome: 'NO_SHOW',
      },
    });
    // L'acompte est conservé (le HolisticPayment reste PENDING pour indiquer que seulement
    // l'acompte a été reçu, pas le total). À recalculer dans /admin/revenus-holistique.
    return NextResponse.json({ success: true, charged: 0, outcome: 'NO_SHOW' });
  }

  return NextResponse.json({ error: 'Outcome non géré.' }, { status: 400 });
}
