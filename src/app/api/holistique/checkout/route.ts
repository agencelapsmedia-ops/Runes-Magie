import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { mirrorAppointmentToBooking, mirrorPaymentToV2 } from '@/lib/holistic-v2-sync';
import { createDailyRoomForAppointment } from '@/lib/daily-co';
import { createCalendarEventForAppointment } from '@/lib/google-calendar';
import { isInternalEmail } from '@/lib/holistic-clients';
import {
  buildBookingEmailData,
  sendInteracInstructionsToClient,
  sendBookingNotificationToPractitioner,
} from '@/lib/holistic-booking-email';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

// URL de la plateforme — toujours forcer un format valide (https + sans trailing slash)
function getAppUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca').trim();
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

// Domaine de retour après Stripe : on réutilise l'origine de la requête (le domaine
// d'où le client a réservé) pour PRÉSERVER sa session (cookie). Évite la déconnexion
// quand on réserve depuis un aperçu (…vercel.app) ou le domaine apex. Repli sur getAppUrl().
function getReturnBase(req: Request): string {
  const origin = (req.headers.get('origin') ?? '').trim();
  if (/^https:\/\/([a-z0-9-]+\.)*(runesetmagie\.ca|vercel\.app)$/i.test(origin)) {
    return origin;
  }
  return getAppUrl();
}

export async function POST(req: Request) {
  try {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { practitionerId, startsAt, endsAt, notes, offeringId, mode, paymentMethod } = await req.json();
  // Méthode de paiement choisie par la cliente : 'CARD' (défaut, Stripe) ou 'INTERAC'.
  const useInterac = paymentMethod === 'INTERAC';

  // Barrière serveur : impossible de réserver un créneau déjà passé (l'affichage
  // les masque déjà, ceci garantit le refus même depuis une page restée ouverte).
  const startsAtDate = new Date(startsAt);
  if (!startsAt || Number.isNaN(startsAtDate.getTime()) || startsAtDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: 'Ce créneau est déjà passé — choisis une plage à venir.' },
      { status: 400 },
    );
  }
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

  // Si une Offering est sélectionnée, utiliser son prix au lieu du hourlyRate du praticien
  let offering = null;
  if (offeringId) {
    offering = await prisma.offering.findUnique({ where: { id: offeringId } });
  }
  const capacity = offering?.capacity ?? 1;

  // Un créneau n'est « tenu » que 5 min après le début d'un paiement par un AUTRE
  // client ; au-delà il redevient réservable. Le RDV non payé est nettoyé plus tard
  // (route by-id) et le lien Stripe expire à 30 min.
  const HOLD_AGO = new Date(Date.now() - 5 * 60 * 1000);

  if (capacity > 1) {
    // Service de GROUPE (formation) : on autorise jusqu'à `capacity` inscriptions
    // au MÊME créneau exact, au lieu de bloquer tout chevauchement.
    const taken = await prisma.holisticAppointment.count({
      where: {
        practitionerId,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        OR: [
          { status: 'CONFIRMED' }, // place payée = prise
          // place en cours de paiement par un AUTRE client depuis moins de 5 min
          { status: 'PENDING', createdAt: { gte: HOLD_AGO }, clientId: { not: clientId } },
        ],
      },
    });
    if (taken >= capacity) {
      return NextResponse.json(
        { error: 'Cette session est complète — toutes les places sont prises.' },
        { status: 409 },
      );
    }
  } else {
    // Service INDIVIDUEL : aucun chevauchement permis.
    const conflictingAppointment = await prisma.holisticAppointment.findFirst({
      where: {
        practitionerId,
        // Chevauchement : (startsAt < existing.endsAt) AND (endsAt > existing.startsAt)
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) },
        OR: [
          { status: 'CONFIRMED' }, // créneau payé = pris
          // créneau en cours de paiement par un AUTRE client depuis moins de 5 min
          { status: 'PENDING', createdAt: { gte: HOLD_AGO }, clientId: { not: clientId } },
        ],
      },
    });
    if (conflictingAppointment) {
      // Peut être un vrai RDV confirmé OU une réservation en cours de paiement
      // (retenue 5 min). Le message reflète les deux cas honnêtement.
      const isHold = conflictingAppointment.status === 'PENDING';
      return NextResponse.json(
        {
          error: isHold
            ? 'Quelqu\'un est en train de réserver ce créneau. S\'il ne confirme pas, il redeviendra disponible dans quelques minutes — réessaie un peu plus tard ou choisis un autre créneau.'
            : 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Choisis un autre créneau.',
        },
        { status: 409 },
      );
    }
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

  // ─── Parcours VIREMENT INTERAC ───────────────────────────────────────────
  // La cliente choisit de payer par virement (montant complet). Le RDV est
  // confirmé tout de suite (créneau bloqué), le paiement reste « en attente »
  // jusqu'à ce que l'admin marque le virement reçu. Pas de Stripe.
  if (useInterac) {
    const interacAppt = await prisma.holisticAppointment.create({
      data: {
        clientId,
        practitionerId,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        notes: enrichedNotes,
        status: 'CONFIRMED',
        paymentMode: 'INTERAC',
        totalAmount: amountTotal,
        depositAmount: amountTotal,
        remainingAmount: 0,
      },
    });
    await prisma.holisticPayment.create({
      data: { appointmentId: interacAppt.id, amountTotal, amountCommission, amountPractitioner, status: 'PENDING' },
    });
    // Miroir V2 (best-effort)
    try {
      const booking = await mirrorAppointmentToBooking({ appointment: interacAppt, noStripeFlow: true });
      if (booking) {
        await mirrorPaymentToV2({
          bookingId: booking.id, amountTotal, amountCommission, amountPractitioner,
          commissionPct: commissionRate * 100, status: 'PENDING',
        });
      }
    } catch (err) {
      console.error('[checkout interac] miroir V2 échoué (non-bloquant)', err);
    }
    // Salle Daily si virtuel + événement Google (best-effort)
    if (mode === 'VIRTUAL') {
      try { await createDailyRoomForAppointment({ appointmentId: interacAppt.id, endsAt: new Date(endsAt) }); }
      catch (err) { console.error('[checkout interac] Daily échoué', err); }
    }
    try { await createCalendarEventForAppointment(interacAppt.id); }
    catch (err) { console.error('[checkout interac] Google Agenda échoué', err); }
    // Courriels : instructions Interac à la cliente + notification praticienne
    try {
      const data = await buildBookingEmailData(interacAppt.id);
      if (data) {
        if (!isInternalEmail(data.clientEmail)) await sendInteracInstructionsToClient(data);
        await sendBookingNotificationToPractitioner(data);
      }
    } catch (err) {
      console.error('[checkout interac] courriels échoués (non-bloquant)', err);
    }
    return NextResponse.json({
      url: `${getReturnBase(req)}/soins/reservation-confirmee?appointment=${interacAppt.id}&interac=1`,
    });
  }

  // ─── Parcours CARTE (Stripe) ─────────────────────────────────────────────
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

  const returnBase = getReturnBase(req);

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
    success_url: `${returnBase}/soins/reservation-confirmee?appointment=${appointment.id}`,
    // cancel_url avec appointmentId pour pouvoir supprimer le RDV PENDING fantôme
    cancel_url: `${returnBase}/soins/reserver/${practitionerId}?cancelled=true&apptId=${appointment.id}`,
    mode: 'payment',
    // Le lien de paiement expire après 30 min (minimum imposé par Stripe) : évite
    // qu'un paiement tardif arrive après le nettoyage de la réservation « en attente ».
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
