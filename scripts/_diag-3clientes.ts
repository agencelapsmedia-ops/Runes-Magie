import { prisma } from '../src/lib/db';
async function main() {
  const rdvs = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      startsAt: { gte: new Date('2026-07-20'), lte: new Date('2026-08-07') },
      client: { OR: [
        { lastName: { contains: 'vaillancourt', mode: 'insensitive' } },
        { lastName: { contains: 'ahmarani', mode: 'insensitive' } },
        { lastName: { contains: 'blanchard', mode: 'insensitive' } },
      ] },
    },
    include: { client: { select: { firstName: true, lastName: true } }, payment: true },
  });
  for (const r of rdvs) {
    console.log(r.id, r.client.firstName, r.client.lastName, r.startsAt.toISOString(), '| total', r.totalAmount, '| acompte', r.depositAmount, '| solde', r.remainingAmount, '| mode', r.paymentMode, '| payment:', r.payment?.status, r.payment?.amountTotal, '| enr:', r.formationEnrollmentId);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
