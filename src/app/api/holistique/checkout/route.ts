import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { mirrorAppointmentToBooking, mirrorPaymentToV2 } from '@/lib/holistic-v2-sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

// URL de la plateforme — toujours forcer un format valide (https + sans trailing slash)
function getAppUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca').trim();
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { practitionerId, startsAt, endsAt, notes, offeringId, mode } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientId = (session.user as any).id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRole = (session.user as any).role;

  // Si la session est un AdminUser (admin via /admin/login), il n'existe pas dans HolisticUser
  // → blocage : il faut un vrai compte CLIENT
  if (sessionRole === 'ADMIN') {
    return NextResponse.json(
      { error: 'Le compte administrateur ne peut pas réserver. Crée-toi un compte client séparé pour tester.' },
      { status: 400 },
    );
  }

  // Vérifie que le clientId existe bien dans HolisticUser (sinon foreign key crash)
  const clientExists = await prisma.holisticUser.findUnique({ where: { id: clientId } });
  if (!clientExists) {
    return NextResponse.json(
      { error: `Compte client introuvable (id=${clientId}). Déconnecte-toi et reconnecte-toi.` },
      { status: 400 },
    );
  }

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!practitioner) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 404 });

  // Anti double-booking : vérifie qu'aucun autre RDV ne chevauche ce créneau
  const conflictingAppointment = await prisma.holisticAppointment.findFirst({
    where: {
      practitionerId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      // Chevauchement : (startsAt < existing.endsAt) AND (endsAt > existing.startsAt)
      startsAt: { lt: new Date(endsAt) },
      endsAt: { gt: new Date(startsAt) },
    },
  });
  if (conflictingAppointment) {
    return NextResponse.json(
      { error: 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Choisis un autre créneau.' },
      { status: 409 },
    );
  }

  // Si une Offering est sélectionnée, utiliser son prix au lieu du hourlyRate du praticien
  let offering = null;
  if (offeringId) {
    offering = await prisma.offering.findUnique({ where: { id: offeringId } });
  }

  // Construit le bloc de notes enrichi avec le service et le mode pour traçabilité
  // (HolisticAppointment legacy n'a pas de champ offeringId/mode)
  const enrichedNotes = [
    offering ? `Service : ${offering.name}` : null,
    mode ? `Mode : ${mode === 'IN_PERSON' ? 'Présentiel' : 'Virtuel (vidéo)'}` : null,
    notes,
  ].filter(Boolean).join('\n') || undefined;

  const durationHours = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (1000 * 60 * 60);
  // Prix : prix de l'Offering si fourni, sinon fallback sur hourlyRate × heures
  const amountTotal = offering ? offering.price : practitioner.hourlyRate * durationHours;

  // ─── Modèle acompte + solde ──────────────────────────────────────────────
  // Services individuels (capacity = 1) : acompte 25 $ à la résa, solde après séance
  // Services de groupe (capacity > 1) : paiement complet à la résa (pas d'acompte)
  const DEPOSIT_AMOUNT = 25;
  const isGroupService = (offering?.capacity ?? 1) > 1;
  const usesDeposit = !isGroupService && amountTotal > DEPOSIT_AMOUNT;
  const amountToCharge = usesDeposit ? DEPOSIT_AMOUNT : amountTotal;
  const amountRemaining = usesDeposit ? amountTotal - DEPOSIT_AMOUNT : 0;

  // Commission : taux par praticien (Practitioner.commissionPct) ou défaut env
  const commissionRate = (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;
  const amountCommission = amountTotal * commissionRate;
  const amountPractitioner = amountTotal - amountCommission;

  // Créer le rdv avec les infos acompte/solde
  const appointment = await prisma.holisticAppointment.create({
    data: {
      clientId,
      practitionerId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      notes: enrichedNotes,
      status: 'PENDING',
      totalAmount: amountTotal,
      depositAmount: usesDeposit ? DEPOSIT_AMOUNT : amountTotal,
      remainingAmount: amountRemaining,
    },
  });

  // Enregistrement paiement (tracker ce qu'on doit au praticien sur le TOTAL au final)
  await prisma.holisticPayment.create({
    data: {
      appointmentId: appointment.id,
      amountTotal,
      amountCommission,
      amountPractitioner,
      status: 'PENDING',
    },
  });

  // Dual-write V2 (best-effort) — flow Stripe → V2 = PENDING_PAYMENT
  let v2BookingId: string | null = null;
  try {
    const booking = await mirrorAppointmentToBooking({ appointment });
    v2BookingId = booking?.id ?? null;
    if (booking) {
      await mirrorPaymentToV2({
        bookingId: booking.id,
        amountTotal,
        amountCommission,
        amountPractitioner,
        commissionPct: commissionRate * 100,
        status: 'PENDING',
      });
    }
  } catch (err) {
    console.error('[v2-sync] mirror checkout failed', { appointmentId: appointment.id, err });
  }

  // 2 modes de paiement supportés :
  //  - Stripe Connect prêt : split auto au moment du paiement (65 % praticienne, 35 % plateforme)
  //  - Stripe Connect pas prêt : encaisse tout sur le compte plateforme, redistribution manuelle plus tard
  const usesStripeConnect = !!(practitioner.stripeAccountId && practitioner.stripeAccountReady);

  // Description claire selon acompte ou total
  const itemDescription = usesDeposit
    ? `Acompte de ${DEPOSIT_AMOUNT} $ — solde de ${amountRemaining.toFixed(2)} $ facturé à la fin de la séance`
    : `${new Date(startsAt).toLocaleDateString('fr-CA')} — ${durationHours}h${mode ? ` (${mode === 'IN_PERSON' ? 'présentiel' : 'vidéo'})` : ''}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutParams: any = {
    payment_method_types: ['card'],
    customer_creation: 'always', // crée toujours un Stripe Customer pour sauvegarder la carte
    line_items: [{
      price_data: {
        currency: 'cad',
        product_data: {
          name: offering
            ? `${offering.name} — ${practitioner.user.firstName} ${practitioner.user.lastName}`.trim()
            : `Consultation avec ${practitioner.user.firstName} ${practitioner.user.lastName}`.trim(),
          description: itemDescription,
        },
        unit_amount: Math.round(amountToCharge * 100),
      },
      quantity: 1,
    }],
    metadata: {
      appointmentId: appointment.id,
      practitionerId,
      amountPractitionerCad: amountPractitioner.toFixed(2),
      amountCommissionCad: amountCommission.toFixed(2),
      amountTotalCad: amountTotal.toFixed(2),
      depositCad: usesDeposit ? DEPOSIT_AMOUNT.toFixed(2) : '0',
      remainingCad: amountRemaining.toFixed(2),
      usesDeposit: usesDeposit ? 'true' : 'false',
      payoutMode: usesStripeConnect ? 'auto-split' : 'manual',
      ...(v2BookingId ? { v2BookingId } : {}),
    },
    success_url: `${getAppUrl()}/soins/dashboard/client?booking=success`,
    // cancel_url avec appointmentId pour pouvoir supprimer le RDV PENDING fantôme
    cancel_url: `${getAppUrl()}/soins/reserver/${practitionerId}?cancelled=true&apptId=${appointment.id}`,
    mode: 'payment',
  };

  // Si acompte : sauvegarder la carte pour facturer le solde plus tard (off-session)
  if (usesDeposit) {
    checkoutParams.payment_intent_data = {
      ...(checkoutParams.payment_intent_data ?? {}),
      setup_future_usage: 'off_session',
    };
    // Ajoute un texte personnalisé sur la page Stripe Checkout pour informer du modèle 2-temps
    checkoutParams.custom_text = {
      submit: {
        message: `En réservant, vous autorisez Runes & Magie à prélever le solde de ${amountRemaining.toFixed(2)} $ sur cette carte à la fin de votre séance.`,
      },
    };
  }

  if (usesStripeConnect) {
    // Split 65/35 sur le MONTANT CHARGÉ (l'acompte si modèle 2-temps, sinon le total)
    // Le split du solde se fera de la même façon au moment du clic « Terminer »
    const commissionOnThisCharge = amountToCharge * commissionRate;
    checkoutParams.payment_intent_data = {
      ...(checkoutParams.payment_intent_data ?? {}),
      application_fee_amount: Math.round(commissionOnThisCharge * 100),
      transfer_data: { destination: practitioner.stripeAccountId },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

  return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    console.error('[POST /api/holistique/checkout] error:', {
      message: e?.message,
      type: e?.type,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
    });
    return NextResponse.json(
      {
        error: e?.message ?? 'Erreur lors de la réservation.',
        stripeCode: e?.code ?? null,
        stripeType: e?.type ?? null,
        prismaCode: e?.code ?? null,
      },
      { status: 500 },
    );
  }
}
