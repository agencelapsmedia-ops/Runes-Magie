/** Diagnostic ponctuel — dossier formation de Chantal Bélanger. */
import { prisma } from '../src/lib/db';

async function main() {
  const clients = await prisma.holisticUser.findMany({
    where: { lastName: { contains: 'mendon', mode: 'insensitive' }, role: 'CLIENT' },
  });
  for (const client of clients) {
    console.log('Cliente:', client.id, client.firstName, client.lastName, client.email);

    const enrollments = await prisma.formationEnrollment.findMany({
      where: { clientId: client.id },
      include: {
        formation: { select: { id: true, code: true, title: true } },
        payments: true,
        progress: { include: { course: { select: { code: true } } }, orderBy: { course: { sortOrder: 'asc' } } },
      },
    });
    for (const e of enrollments) {
      console.log(' Inscription', e.id, e.formation.code, '| statut', e.status);
      for (const p of e.payments) console.log('  paiement:', p.amount, p.method, p.status, p.note);
      console.log('  progression:', e.progress.map((p) => `${p.course.code}:${p.state}`).join(' '));
    }

    const credits = await prisma.formationCreditTransaction.findMany({
      where: { clientId: client.id }, orderBy: { createdAt: 'asc' },
    });
    for (const c of credits) console.log(' crédit:', c.delta, c.type, c.reason, '| rdv', c.appointmentId);

    const rdvs = await prisma.holisticAppointment.findMany({
      where: { clientId: client.id, startsAt: { gte: new Date('2026-08-01') } },
      orderBy: { startsAt: 'asc' },
    });
    for (const r of rdvs) {
      console.log(' RDV', r.id, r.startsAt.toISOString(), r.status, r.paymentMode, r.totalAmount, '| depositPaidAt', r.depositPaidAt, '| notes:', r.notes?.slice(0, 80), '| enr:', r.formationEnrollmentId, '| cours:', r.formationCourseId);
    }
    console.log('');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
