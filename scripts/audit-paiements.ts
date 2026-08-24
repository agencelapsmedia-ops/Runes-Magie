/**
 * Audit des paiements (lecture seule) — croise la BD avec l'API Stripe pour
 * déterminer où chaque paiement est réellement allé (compte principal vs
 * comptes Express connectés). Sort un JSON complet dans exports/.
 *
 * Usage : npx tsx scripts/audit-paiements.ts
 */
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

const ACCOUNTS: Record<string, string> = {
  acct_1TfRwq5UKumEzHpa: 'Express Noctura/Jonathan (CIBC fermé)',
  acct_1TfS3e5GK8iZv09L: 'Express Jonathan Laplante',
  acct_1TpHQ1GCc3SuZcAG: 'Express Bohemia',
};

async function inspectPI(piId: string) {
  try {
    const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const charge = pi.latest_charge as any;
    const dest = (pi.transfer_data?.destination as string | null) ?? null;
    return {
      id: piId,
      statut: pi.status,
      montant: pi.amount / 100,
      montantRecu: pi.amount_received / 100,
      fraisPlateforme: (pi.application_fee_amount ?? 0) / 100,
      destination: dest,
      destinationNom: dest ? (ACCOUNTS[dest] ?? dest) : 'Compte principal Runes & Magie',
      rembourse: charge?.amount_refunded ? charge.amount_refunded / 100 : 0,
      dateCharge: charge?.created ? new Date(charge.created * 1000).toISOString() : null,
    };
  } catch (e) {
    return { id: piId, erreur: (e as Error).message };
  }
}

async function main() {
  const appts = await prisma.holisticAppointment.findMany({
    orderBy: { startsAt: 'asc' },
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
      payment: true,
    },
  });

  const rows = [];
  for (const a of appts) {
    const piDeposit = a.payment?.stripePaymentIntentId ?? null;
    const piRemainder = a.remainderPaymentIntentId ?? null;
    const stripeDeposit = piDeposit ? await inspectPI(piDeposit) : null;
    const stripeRemainder = piRemainder ? await inspectPI(piRemainder) : null;

    rows.push({
      id: a.id,
      date: a.startsAt.toISOString(),
      cliente: `${a.client.firstName} ${a.client.lastName}`.trim(),
      courriel: a.client.email,
      praticienne: `${a.practitioner.user.firstName} ${a.practitioner.user.lastName}`.trim(),
      statut: a.status,
      issue: a.completionOutcome,
      modePaiement: a.paymentMode ?? 'STRIPE (site)',
      montantTotal: a.totalAmount,
      acompte: a.depositAmount,
      solde: a.remainingAmount,
      acomptePayeLe: a.depositPaidAt?.toISOString() ?? null,
      soldeChargeLe: a.remainderChargedAt?.toISOString() ?? null,
      annuleLe: a.cancelledAt?.toISOString() ?? null,
      paiementStatut: a.payment?.status ?? null,
      paiementPayeLe: a.payment?.paidAt?.toISOString() ?? null,
      stripeAcompte: stripeDeposit,
      stripeSolde: stripeRemainder,
      notes: a.notes,
    });
  }

  const outPath = path.resolve(__dirname, '..', '..', 'exports', 'audit-paiements-brut.json');
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`${rows.length} RDV audités → ${outPath}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
