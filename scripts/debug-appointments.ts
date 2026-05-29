/**
 * Affiche tous les RDV en base + les utilisateurs HolisticUser
 * pour debugger pourquoi un RDV ne s'affiche pas sur le dashboard client.
 *
 * Exécution :
 *   npx tsx scripts/debug-appointments.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Debug RDV et utilisateurs\n');

  // 1) Tous les RDV récents
  const appts = await prisma.holisticAppointment.findMany({
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
      payment: { select: { status: true, amountTotal: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📅 RDV en base (${appts.length} derniers) :`);
  if (appts.length === 0) {
    console.log('   (aucun)\n');
  } else {
    for (const a of appts) {
      console.log(`
   ID         : ${a.id}
   Créé le    : ${new Date(a.createdAt).toLocaleString('fr-CA', { timeZone: 'America/Toronto' })}
   Date RDV   : ${new Date(a.startsAt).toLocaleString('fr-CA', { timeZone: 'America/Toronto' })}
   Status     : ${a.status} ${a.completionOutcome ? `(${a.completionOutcome})` : ''}
   Client     : ${a.client.firstName} ${a.client.lastName} (${a.client.email}) [id: ${a.clientId}]
   Praticien  : ${a.practitioner.user.firstName} ${a.practitioner.user.lastName}
   Acompte    : ${a.depositAmount ?? '—'} $ ${a.depositPaidAt ? `(payé le ${new Date(a.depositPaidAt).toLocaleString('fr-CA', { timeZone: 'America/Toronto' })})` : '(non payé)'}
   Solde      : ${a.remainingAmount ?? '—'} $
   Total      : ${a.totalAmount ?? '—'} $
   Paiement   : ${a.payment?.status ?? 'aucun'}
   Stripe PM  : ${a.stripePaymentMethodId ? 'sauvegardé ✓' : 'aucun'}`);
    }
  }

  // 2) Tous les HolisticUser
  console.log('\n\n👥 Utilisateurs HolisticUser :');
  const users = await prisma.holisticUser.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  for (const u of users) {
    console.log(`   • ${u.role.padEnd(13)} ${u.firstName} ${u.lastName} (${u.email}) [id: ${u.id}]`);
  }

  console.log('\n✓ Debug terminé\n');
}

main()
  .catch((e) => { console.error('❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
