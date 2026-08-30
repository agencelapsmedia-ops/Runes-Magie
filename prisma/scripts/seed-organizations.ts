/**
 * Seed des marques du module Publications : Runes & Magie + RCA Distribution.
 * Idempotent (upsert) — le lancer ne touche pas une charte déjà personnalisée
 * dans l'admin (seul `name` est resynchronisé, la charte n'est posée qu'à la
 * création).
 *
 * Usage : npm run db:seed:organisations
 */

import { PrismaClient } from '@prisma/client';
import { CHARTE_NEUTRE, CHARTE_RUNES_ET_MAGIE } from '../../src/lib/organizations';

const prisma = new PrismaClient();

const MARQUES = [
  {
    id: 'runes-et-magie',
    name: 'Runes & Magie',
    charte: CHARTE_RUNES_ET_MAGIE,
  },
  {
    id: 'rca-distribution',
    name: 'RCA Distribution',
    charte: {
      ...CHARTE_NEUTRE,
      voix:
        'Entreprise québécoise de distribution. Style : français du Québec, ton professionnel, ' +
        'direct et fiable. Pas de promesse de résultat garanti.',
    },
  },
];

async function main() {
  for (const m of MARQUES) {
    const resultat = await prisma.organization.upsert({
      where: { id: m.id },
      update: { name: m.name },
      create: {
        id: m.id,
        name: m.name,
        charte: JSON.parse(JSON.stringify(m.charte)),
      },
    });
    console.log(`✓ ${resultat.id} — ${resultat.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
