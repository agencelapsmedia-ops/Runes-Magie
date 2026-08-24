/** Diagnostic ponctuel — dossier formation de Nathalie Leprohon. */
import { prisma } from '../src/lib/db';

async function main() {
  const client = await prisma.holisticUser.findFirst({
    where: { email: { equals: 'nathalieleprohon@gmail.com', mode: 'insensitive' }, role: 'CLIENT' },
  });
  if (!client) throw new Error('Cliente introuvable');
  console.log('Cliente:', client.id, client.firstName, client.lastName);

  const enrollments = await prisma.formationEnrollment.findMany({
    where: { clientId: client.id },
    include: { formation: { select: { code: true, title: true, pricePerCourse: true, pricePerBlock10: true } }, payments: true },
  });
  for (const e of enrollments) {
    console.log('\nInscription', e.id, e.formation.code, e.formation.title, '| statut', e.status, '| totalPrice', e.totalPrice);
    console.log('  prix/cours', e.formation.pricePerCourse, '| bloc10', e.formation.pricePerBlock10);
    for (const p of e.payments) console.log('  paiement:', p.amount, p.method, p.status, p.paidAt.toISOString(), p.note);
  }

  const credits = await prisma.formationCreditTransaction.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'asc' },
  });
  console.log('\nCrédits:');
  for (const c of credits) console.log(' ', c.delta, c.type, c.reason, c.createdBy, c.createdAt.toISOString(), 'rdv:', c.appointmentId);

  const rdvs = await prisma.holisticAppointment.findMany({
    where: { clientId: client.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
  });
  console.log('\nRDV à venir:');
  for (const r of rdvs) {
    console.log(JSON.stringify(r, null, 2));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
