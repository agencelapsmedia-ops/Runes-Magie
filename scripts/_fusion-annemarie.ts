/**
 * Fusion ponctuelle (2026-08-24) — Anne-Marie Gagnon.
 * Le compte interne (5147716885@interne.invalid) porte la formation, les jetons
 * et le paiement 675 $ ; le vrai compte web (pompette80@hotmail.com) porte ses
 * réservations en ligne. On rattache tout au vrai compte, on convertit le RDV
 * du 16 sept en jeton (RF04), puis on marque le compte interne comme fusionné.
 */
import { prisma } from '../src/lib/db';

const ACTOR = 'Migration (Jonathan)';
const INTERNE = 'cmsywsfmf0000la043jkeckoj'; // 5147716885@interne.invalid
const REEL = 'cmsckore50000jm04eenf4w9b'; // pompette80@hotmail.com
const RDV_16_SEPT = 'cmt09ztht0001kv04ha4lh0kq';

async function main() {
  // 1. Rattacher toutes les données du compte interne au vrai compte
  const moves: [string, number][] = [];
  await prisma.$transaction(async (tx) => {
    moves.push(['inscriptions', (await tx.formationEnrollment.updateMany({ where: { clientId: INTERNE }, data: { clientId: REEL } })).count]);
    moves.push(['jetons', (await tx.formationCreditTransaction.updateMany({ where: { clientId: INTERNE }, data: { clientId: REEL } })).count]);
    moves.push(['reçus', (await tx.receipt.updateMany({ where: { clientId: INTERNE }, data: { clientId: REEL } })).count]);
    moves.push(['RDV', (await tx.holisticAppointment.updateMany({ where: { clientId: INTERNE }, data: { clientId: REEL } })).count]);
    moves.push(['notifications', (await tx.holisticNotification.updateMany({ where: { userId: INTERNE }, data: { userId: REEL } })).count]);
  });
  for (const [what, n] of moves) console.log(`✓ ${n} ${what} déplacé(s) vers le vrai compte`);

  // 2. RDV du 16 septembre → jeton (RF04)
  const appt = await prisma.holisticAppointment.findUnique({ where: { id: RDV_16_SEPT } });
  if (!appt) throw new Error('RDV du 16 sept introuvable');
  const enrollment = await prisma.formationEnrollment.findFirst({
    where: { clientId: REEL, formation: { code: 'RF' } },
    select: { id: true, formationId: true },
  });
  if (!enrollment) throw new Error('Inscription RF introuvable après fusion');
  if (appt.paymentMode !== 'FORMATION_CREDIT') {
    const rf04 = await prisma.formationCourse.findUnique({
      where: { formationId_code: { formationId: enrollment.formationId, code: 'RF04' } },
    });
    if (!rf04) throw new Error('Cours RF04 introuvable');
    await prisma.$transaction(async (tx) => {
      await tx.holisticAppointment.update({
        where: { id: RDV_16_SEPT },
        data: {
          paymentMode: 'FORMATION_CREDIT',
          totalAmount: 0,
          depositAmount: 0,
          remainingAmount: 0,
          depositPaidAt: appt.depositPaidAt ?? new Date(),
          formationEnrollmentId: enrollment.id,
          formationCourseId: rf04.id,
        },
      });
      await tx.formationCreditTransaction.create({
        data: {
          clientId: REEL,
          enrollmentId: enrollment.id,
          delta: -1,
          type: 'USE',
          reason: 'Rencontre RF04 — RDV du 16 sept converti au paiement par jeton (fusion de comptes)',
          createdBy: ACTOR,
          appointmentId: RDV_16_SEPT,
        },
      });
      await tx.formationAuditLog.create({
        data: {
          enrollmentId: enrollment.id,
          actor: ACTOR,
          action: 'CREDIT_USE',
          detail: '−1 jeton — RDV du 16 sept (RF04) converti d’Interac 89,99 $ au paiement par jeton (fusion de comptes)',
        },
      });
    }, { isolationLevel: 'Serializable' });
    console.log('✓ RDV du 16 sept converti en jeton (RF04).');
  } else {
    console.log('= RDV du 16 sept déjà en FORMATION_CREDIT.');
  }

  // 3. Marquer le compte interne comme fusionné (on ne supprime rien)
  await prisma.holisticUser.update({
    where: { id: INTERNE },
    data: { lastName: 'Gagnon (compte fusionné — utiliser pompette80@hotmail.com)' },
  });
  await prisma.formationAuditLog.create({
    data: {
      enrollmentId: enrollment.id,
      actor: ACTOR,
      action: 'NOTE',
      detail: 'Fusion de comptes : données du compte interne 5147716885@interne.invalid rattachées à pompette80@hotmail.com',
    },
  });
  console.log('✓ Compte interne marqué comme fusionné.');

  // Vérification finale
  const solde = await prisma.formationCreditTransaction.aggregate({ where: { clientId: REEL }, _sum: { delta: true } });
  console.log(`\nSolde de jetons sur le vrai compte : ${solde._sum.delta}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
