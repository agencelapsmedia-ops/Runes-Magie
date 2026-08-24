/** Complétion ponctuelle (2026-08-24) — RDV de sara hamraoui du 22 juin (payé, rien à prélever). */
import { prisma } from '../src/lib/db';

async function main() {
  const id = 'cmql7o0lj0002jv049wadcjzx';
  const r = await prisma.holisticAppointment.findUnique({ where: { id } });
  if (!r) throw new Error('RDV introuvable');
  if (r.status === 'COMPLETED') { console.log('= Déjà terminé.'); return; }
  if ((r.remainingAmount ?? 0) > 0) throw new Error(`Solde non nul (${r.remainingAmount}) — ne pas compléter en script.`);
  await prisma.holisticAppointment.update({
    where: { id },
    data: { status: 'COMPLETED', completionOutcome: 'CHARGED' },
  });
  console.log('✓ RDV de sara hamraoui (22 juin) marqué terminé — aucun prélèvement.');
}
main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
