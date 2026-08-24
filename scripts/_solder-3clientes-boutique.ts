/**
 * Correction ponctuelle (2026-08-24) — trois séances dont le solde a été payé
 * par carte À LA BOUTIQUE (Clover) : Brigitte Vaillancourt (21 juil.),
 * Marie Élise Roy Ahmarani (5 août), Annie Blanchard (6 août).
 * On marque le paiement reçu et la séance terminée SANS prélever la carte en ligne.
 */
import { prisma } from '../src/lib/db';

const IDS = [
  'cmrdzzyqk0001l604txuexgk9',
  'cmrr2s8u80001l7043w3sszgx',
  'cmse7ccdj0001jo04omj87y3a',
];

async function main() {
  for (const id of IDS) {
    const r = await prisma.holisticAppointment.findUnique({
      where: { id },
      include: { client: { select: { firstName: true, lastName: true } }, payment: true },
    });
    if (!r) { console.error('✗ RDV introuvable', id); continue; }
    if (r.status === 'COMPLETED') { console.log('=', r.client.firstName, r.client.lastName, 'déjà terminé'); continue; }
    await prisma.$transaction([
      prisma.holisticAppointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completionOutcome: 'CHARGED',
          remainingAmount: 0,
          notes: (r.notes ?? '') + '\nSolde payé par carte à la boutique (Clover) — aucun prélèvement en ligne.',
        },
      }),
      ...(r.payment
        ? [prisma.holisticPayment.update({
            where: { appointmentId: id },
            data: { status: 'PAID', paidAt: new Date() },
          })]
        : []),
    ]);
    console.log('✓', r.client.firstName, r.client.lastName, '— séance terminée, paiement marqué reçu (solde payé en boutique).');
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
