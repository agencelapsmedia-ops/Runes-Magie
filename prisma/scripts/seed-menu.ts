/**
 * Seed du menu de navigation (table MenuItem).
 * Reprend les liens actuellement codés en dur :
 *  - HEADER  → src/components/layout/Navbar.tsx
 *  - FOOTER  → src/components/layout/Footer.tsx (colonne « Navigation »)
 *
 * Idempotent : si une location a déjà des items, on n'y touche pas.
 * Lancer :  npx tsx prisma/scripts/seed-menu.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HEADER = [
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

const FOOTER = [
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Infolettre', href: '/infolettre' },
  { label: 'Contact', href: '/contact' },
];

async function seedLocation(
  location: 'HEADER' | 'FOOTER',
  items: { label: string; href: string }[],
) {
  const existing = await prisma.menuItem.count({ where: { location } });
  if (existing > 0) {
    console.log(`[${location}] ${existing} item(s) déjà présents — ignoré.`);
    return;
  }
  for (let i = 0; i < items.length; i++) {
    await prisma.menuItem.create({
      data: {
        label: items[i].label,
        href: items[i].href,
        type: 'PAGE',
        location,
        isVisible: true,
        sortOrder: (i + 1) * 10,
      },
    });
  }
  console.log(`[${location}] ${items.length} item(s) créés.`);
}

async function main() {
  await seedLocation('HEADER', HEADER);
  await seedLocation('FOOTER', FOOTER);
  const total = await prisma.menuItem.count();
  console.log(`Total MenuItem en base : ${total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
