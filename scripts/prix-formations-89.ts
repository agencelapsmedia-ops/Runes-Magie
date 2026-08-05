/**
 * Aligne toutes les formations de l'École de Sorcellerie à 89,99 $ la séance
 * et retire les tarifs duo (le duo ne fonctionne pas encore : on ne veut pas
 * que des gens réservent à ce prix).
 *
 *   npx tsx scripts/prix-formations-89.ts           → simulation
 *   npx tsx scripts/prix-formations-89.ts --apply   → écrit en production
 *
 * Cible : Offering de type COURS ou ATELIER (voir ECOLE_TYPES dans lib/offerings).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const PRIX = 89.99;

(async () => {
  const items = await prisma.offering.findMany({
    // « Soirée d'Animation » (349,99 $) est un événement, pas une formation :
    // elle ne doit surtout pas tomber à 89,99 $.
    where: { type: { in: ['COURS', 'ATELIER'] }, NOT: { name: { contains: 'Animation', mode: 'insensitive' } } },
    select: {
      id: true, slug: true, name: true, type: true, isActive: true,
      price: true, priceForTwo: true, pricePackage: true, pricePackageMsrp: true, numSessions: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log(APPLY ? '\n>>> APPLY — écriture en production <<<\n' : '\n>>> SIMULATION — aucune écriture <<<\n');
  console.log(`${items.length} formations (COURS + ATELIER)\n`);

  for (const o of items) {
    const chg: string[] = [];
    if (o.price !== PRIX) chg.push(`prix ${o.price} → ${PRIX}`);
    if (o.priceForTwo != null) chg.push(`duo ${o.priceForTwo} → retiré`);
    if (o.pricePackage != null) chg.push(`forfait ${o.pricePackage} → retiré`);
    console.log(
      `  ${o.isActive ? '●' : '○'} ${o.name.padEnd(34)} ${o.numSessions ? `${o.numSessions} séances` : ''}\n` +
      `      ${chg.length ? chg.join(' · ') : 'déjà conforme'}`,
    );
  }

  if (!APPLY) {
    console.log('\nSimulation terminée. Relancer avec --apply.\n');
    await prisma.$disconnect();
    return;
  }

  const r = await prisma.offering.updateMany({
    // « Soirée d'Animation » (349,99 $) est un événement, pas une formation :
    // elle ne doit surtout pas tomber à 89,99 $.
    where: { type: { in: ['COURS', 'ATELIER'] }, NOT: { name: { contains: 'Animation', mode: 'insensitive' } } },
    data: { price: PRIX, priceForTwo: null, pricePackage: null, pricePackageMsrp: null },
  });
  console.log(`\n${r.count} formations mises à jour : ${PRIX} $ la séance, aucun tarif duo ni forfait.\n`);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });
