/**
 * Génération rétroactive des reçus (2026-08-22) pour les paiements déjà
 * encaissés avant la mise en place du module Reçus. AUCUN courriel envoyé.
 * Idempotent (contraintes uniques par source) — relançable sans doublon.
 *   npx tsx scripts/_generer-recus-anterieurs.ts
 */
import { prisma } from '../src/lib/db';
import { createReceipt, serviceFromNotes } from '../src/lib/receipt-service';

async function main() {
  let crees = 0;

  const appts = await prisma.holisticAppointment.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: { payment: true, client: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  for (const a of appts) {
    const service = serviceFromNotes(a.notes);
    const nom = `${a.client.firstName} ${a.client.lastName}`;

    // Jetons : pas d'argent → pas de reçu.
    if (a.paymentMode === 'FORMATION_CREDIT') continue;

    if (a.paymentMode === 'INTERAC' || a.paymentMode === 'CASH') {
      // Paiement complet manuel encaissé (confirmé par Noctura).
      if (a.payment?.status === 'PAID') {
        const r = await createReceipt({
          clientId: a.clientId,
          description: service,
          amount: a.payment.amountTotal,
          method: a.paymentMode === 'CASH' ? 'CASH' : 'INTERAC',
          paidAt: a.payment.paidAt ?? a.startsAt,
          appointmentId: a.id,
          kind: 'FULL',
          sendEmail: false,
        });
        if (r) { crees++; console.log(`${r.number} — ${nom} — ${service} (${a.paymentMode})`); }
      }
      continue;
    }

    // Parcours Stripe (site ou lien) : acompte payé, puis solde éventuel.
    if (a.depositPaidAt && (a.depositAmount ?? 0) > 0) {
      const usesDeposit = (a.remainingAmount ?? 0) > 0 || a.remainderChargedAt != null;
      const r = await createReceipt({
        clientId: a.clientId,
        description: usesDeposit ? `Acompte — ${service}` : service,
        amount: a.depositAmount ?? 0,
        method: 'CARD',
        paidAt: a.depositPaidAt,
        appointmentId: a.id,
        kind: usesDeposit ? 'DEPOSIT' : 'FULL',
        sendEmail: false,
      });
      if (r) { crees++; console.log(`${r.number} — ${nom} — acompte/complet carte`); }
    }
    if (a.remainderChargedAt && (a.remainingAmount ?? 0) > 0) {
      const r = await createReceipt({
        clientId: a.clientId,
        description: `Solde — ${service}`,
        amount: a.remainingAmount ?? 0,
        method: 'CARD',
        paidAt: a.remainderChargedAt,
        appointmentId: a.id,
        kind: 'REMAINDER',
        sendEmail: false,
      });
      if (r) { crees++; console.log(`${r.number} — ${nom} — solde carte`); }
    }
  }

  // Paiements de formation historiques (déjà PAID) sans reçu.
  const fps = await prisma.formationPayment.findMany({
    where: { status: 'PAID' },
    include: { enrollment: { include: { formation: { select: { title: true } }, client: { select: { firstName: true, lastName: true } } } } },
  });
  for (const p of fps) {
    const r = await createReceipt({
      clientId: p.enrollment.clientId,
      description: p.note?.trim()
        ? `Formation ${p.enrollment.formation.title} — ${p.note.trim()}`
        : `Formation ${p.enrollment.formation.title}`,
      amount: p.amount,
      method: p.method as 'INTERAC' | 'CARD' | 'CASH' | 'OTHER',
      paidAt: p.paidAt,
      formationPaymentId: p.id,
      kind: 'FORMATION',
      sendEmail: false,
    });
    if (r) { crees++; console.log(`${r.number} — ${p.enrollment.client.firstName} — formation`); }
  }

  console.log(`\n${crees} reçu(s) généré(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
