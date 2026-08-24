/**
 * Correction ponctuelle (2026-08-24) — blocs de 10 cours payés avant migration.
 *  - Chantal Bélanger : RDV du 4 sept (RF02, à la carte Interac 89,99 $) → jeton.
 *  - Anne-Marie Gagnon (compte interne) : paiement 675 $ jamais enregistré → ajouté
 *    (reçu sans courriel) ; RDV du 19 août (RF03, comptant 89,99 $) → jeton.
 */
import { prisma } from '../src/lib/db';
import { createReceipt } from '../src/lib/receipt-service';

const ACTOR = 'Migration (Jonathan)';

async function convertToCredit(apptId: string, enrollmentId: string, courseCode: string, detail: string) {
  const appt = await prisma.holisticAppointment.findUnique({ where: { id: apptId } });
  if (!appt) throw new Error(`RDV introuvable : ${apptId}`);
  if (appt.paymentMode === 'FORMATION_CREDIT') {
    console.log(`= RDV ${apptId} déjà en FORMATION_CREDIT.`);
    return;
  }
  const enrollment = await prisma.formationEnrollment.findUnique({
    where: { id: enrollmentId }, select: { clientId: true, formationId: true },
  });
  if (!enrollment) throw new Error(`Inscription introuvable : ${enrollmentId}`);
  const course = await prisma.formationCourse.findUnique({
    where: { formationId_code: { formationId: enrollment.formationId, code: courseCode } },
  });
  if (!course) throw new Error(`Cours introuvable : ${courseCode}`);

  await prisma.$transaction(async (tx) => {
    await tx.holisticAppointment.update({
      where: { id: apptId },
      data: {
        paymentMode: 'FORMATION_CREDIT',
        totalAmount: 0,
        depositAmount: 0,
        remainingAmount: 0,
        depositPaidAt: appt.depositPaidAt ?? new Date(),
        formationEnrollmentId: enrollmentId,
        formationCourseId: course.id,
      },
    });
    await tx.formationCreditTransaction.create({
      data: {
        clientId: enrollment.clientId,
        enrollmentId,
        delta: -1,
        type: 'USE',
        reason: `Rencontre ${courseCode} — RDV converti au paiement par jeton (correction migration)`,
        createdBy: ACTOR,
        appointmentId: apptId,
      },
    });
    await tx.formationAuditLog.create({
      data: { enrollmentId, actor: ACTOR, action: 'CREDIT_USE', detail },
    });
  }, { isolationLevel: 'Serializable' });
  console.log(`✓ RDV ${apptId} converti en jeton (${courseCode}).`);
}

async function main() {
  // 1. Chantal — RDV du 4 septembre → jeton RF02
  await convertToCredit(
    'cmt3c6xiu0001ib0480u8opxr',
    'cmt3pruet0001vavcue4fwmnt',
    'RF02',
    '−1 jeton — RDV du 4 sept (RF02) converti d’Interac 89,99 $ au paiement par jeton',
  );

  // 2. Anne-Marie — paiement 675 $ historique (idempotent)
  const AM_ENR = 'cmt3pp41r002mvans03um6619';
  const enr = await prisma.formationEnrollment.findUnique({
    where: { id: AM_ENR },
    include: { formation: { select: { title: true } } },
  });
  if (!enr) throw new Error('Inscription Anne-Marie introuvable');
  const existing = await prisma.formationPayment.findFirst({ where: { enrollmentId: AM_ENR, amount: 675 } });
  if (existing) {
    console.log('= Paiement 675 $ Anne-Marie déjà présent.');
  } else {
    const paidAt = new Date('2026-08-18T00:00:00-04:00');
    const payment = await prisma.formationPayment.create({
      data: {
        enrollmentId: AM_ENR,
        amount: 675,
        paidAt,
        method: 'CASH',
        status: 'PAID',
        note: 'Bloc de 10 cours — paiement historique (avant migration)',
        createdBy: ACTOR,
      },
    });
    await prisma.formationAuditLog.create({
      data: {
        enrollmentId: AM_ENR,
        actor: ACTOR,
        action: 'PAYMENT_ADDED',
        detail: '675.00 $ (CASH) — Bloc de 10 cours, paiement historique (avant migration)',
      },
    });
    await createReceipt({
      clientId: enr.clientId,
      description: `Formation ${enr.formation.title} — Bloc de 10 cours (historique)`,
      amount: 675,
      method: 'CASH',
      paidAt,
      formationPaymentId: payment.id,
      kind: 'FORMATION',
      sendEmail: false,
    });
    console.log('✓ Paiement 675 $ Anne-Marie enregistré + reçu (sans courriel).');
  }

  // 3. Anne-Marie — RDV du 19 août → jeton RF03
  await convertToCredit(
    'cmsywsfwa0002la04qtushsaw',
    AM_ENR,
    'RF03',
    '−1 jeton — RDV du 19 août (RF03) converti de comptant 89,99 $ au paiement par jeton',
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
