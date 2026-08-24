/**
 * Correction ponctuelle (2026-08-24) — Nathalie Leprohon.
 *  1. Enregistre le paiement historique de 675 $ (bloc de 10 cours, payé avant
 *     la migration) : FormationPayment + journal + reçu SANS courriel.
 *  2. Convertit le RDV de demain (TP06, réservé à la carte Interac 89,99 $ avant
 *     la migration) en RDV payé par jeton : FORMATION_CREDIT, −1 jeton, liens
 *     inscription/cours. Le badge « virement non confirmé » disparaît.
 */
import { prisma } from '../src/lib/db';
import { createReceipt } from '../src/lib/receipt-service';

const ACTOR = 'Migration (Jonathan)';
const ENROLLMENT_ID = 'cmt3pokjx0001vans3cf9ijwf';
const APPOINTMENT_ID = 'cmt2zy89p0001jr04og4dnzew';

async function main() {
  const enrollment = await prisma.formationEnrollment.findUnique({
    where: { id: ENROLLMENT_ID },
    include: { formation: { select: { id: true, title: true } } },
  });
  if (!enrollment) throw new Error('Inscription introuvable');

  // 1. Paiement historique 675 $ (idempotent)
  const existing = await prisma.formationPayment.findFirst({
    where: { enrollmentId: ENROLLMENT_ID, amount: 675 },
  });
  if (existing) {
    console.log('= Paiement 675 $ déjà présent, rien à faire.');
  } else {
    const paidAt = new Date('2026-08-21T00:00:00-04:00');
    const payment = await prisma.formationPayment.create({
      data: {
        enrollmentId: ENROLLMENT_ID,
        amount: 675,
        paidAt,
        method: 'INTERAC',
        status: 'PAID',
        note: 'Bloc de 10 cours — paiement historique (avant migration)',
        createdBy: ACTOR,
      },
    });
    await prisma.formationAuditLog.create({
      data: {
        enrollmentId: ENROLLMENT_ID,
        actor: ACTOR,
        action: 'PAYMENT_ADDED',
        detail: '675.00 $ (INTERAC) — Bloc de 10 cours, paiement historique (avant migration)',
      },
    });
    await createReceipt({
      clientId: enrollment.clientId,
      description: `Formation ${enrollment.formation.title} — Bloc de 10 cours (historique)`,
      amount: 675,
      method: 'INTERAC',
      paidAt,
      formationPaymentId: payment.id,
      kind: 'FORMATION',
      sendEmail: false,
    });
    console.log('✓ Paiement 675 $ enregistré + reçu (sans courriel).');
  }

  // 2. RDV de demain → payé par jeton
  const appt = await prisma.holisticAppointment.findUnique({ where: { id: APPOINTMENT_ID } });
  if (!appt) throw new Error('RDV introuvable');
  if (appt.paymentMode === 'FORMATION_CREDIT') {
    console.log('= RDV déjà en FORMATION_CREDIT, rien à faire.');
    return;
  }

  const tp06 = await prisma.formationCourse.findUnique({
    where: { formationId_code: { formationId: enrollment.formation.id, code: 'TP06' } },
  });
  if (!tp06) throw new Error('Cours TP06 introuvable');

  await prisma.$transaction(async (tx) => {
    await tx.holisticAppointment.update({
      where: { id: APPOINTMENT_ID },
      data: {
        paymentMode: 'FORMATION_CREDIT',
        totalAmount: 0,
        depositAmount: 0,
        remainingAmount: 0,
        depositPaidAt: new Date(),
        formationEnrollmentId: ENROLLMENT_ID,
        formationCourseId: tp06.id,
      },
    });
    await tx.formationCreditTransaction.create({
      data: {
        clientId: enrollment.clientId,
        enrollmentId: ENROLLMENT_ID,
        delta: -1,
        type: 'USE',
        reason: 'Rencontre TP06 — RDV converti au paiement par jeton (correction migration)',
        createdBy: ACTOR,
        appointmentId: APPOINTMENT_ID,
      },
    });
    await tx.formationAuditLog.create({
      data: {
        enrollmentId: ENROLLMENT_ID,
        actor: ACTOR,
        action: 'CREDIT_USE',
        detail: '−1 jeton — RDV du 25 août (TP06) converti d’Interac 89,99 $ au paiement par jeton',
      },
    });
  }, { isolationLevel: 'Serializable' });
  console.log('✓ RDV de demain converti en paiement par jeton (TP06, −1 jeton).');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
