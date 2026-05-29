/**
 * Supprime les RDV PENDING > 1h qui n'ont pas reçu de paiement.
 * Garbage collector pour les sessions Stripe Checkout abandonnées.
 *
 * Exécution manuelle :
 *   npx tsx scripts/cleanup-pending-appointments.ts
 *
 * Idéalement à brancher sur un cron Vercel (vercel.json) toutes les heures.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹 Cleanup des RDV PENDING fantômes\n');

  // Limite : tous les PENDING créés il y a plus d'1 heure
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);

  const pending = await prisma.holisticAppointment.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    include: { payment: true },
  });

  if (pending.length === 0) {
    console.log('✓ Aucun RDV PENDING fantôme à supprimer.\n');
    return;
  }

  console.log(`Trouvé ${pending.length} RDV PENDING > 1h :`);
  for (const a of pending) {
    console.log(`  • ${a.id} — créé le ${new Date(a.createdAt).toLocaleString('fr-CA')} (paiement: ${a.payment?.status ?? 'aucun'})`);
  }

  // Filtre : on ne supprime PAS ceux dont le paiement est PAID (sécurité)
  const toDelete = pending.filter((a) => a.payment?.status !== 'PAID');
  const skipped = pending.length - toDelete.length;
  if (skipped > 0) {
    console.log(`\n⚠️  ${skipped} RDV gardés car paiement PAID (à investiguer manuellement).`);
  }

  // Supprime les paiements PENDING en cascade
  await prisma.holisticPayment.deleteMany({
    where: {
      appointmentId: { in: toDelete.map((a) => a.id) },
      status: { not: 'PAID' },
    },
  });
  const deleted = await prisma.holisticAppointment.deleteMany({
    where: { id: { in: toDelete.map((a) => a.id) } },
  });

  console.log(`\n✨ ${deleted.count} RDV PENDING supprimé(s).\n`);
}

main()
  .catch((e) => { console.error('\n❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
