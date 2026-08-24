/** Vérification ponctuelle — statut du RDV de Karine De-Mendonsa. */
import { prisma } from '../src/lib/db';

async function main() {
  const r = await prisma.holisticAppointment.findUnique({ where: { id: 'cmsqm1puy0001ie04wlhu5wcs' } });
  console.log('statut:', r?.status, '| outcome:', r?.completionOutcome, '| maj:', r?.updatedAt?.toISOString());
}
main().finally(() => prisma.$disconnect());
