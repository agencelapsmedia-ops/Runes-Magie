import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface Update {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
}

async function main() {
  const updates: Update[] = JSON.parse(fs.readFileSync('scripts/tarot-updates.json', 'utf-8'));

  console.log(`Mise a jour des descriptions pour ${updates.length} tarots...`);

  let updated = 0;
  for (const u of updates) {
    const product = await prisma.product.findUnique({ where: { slug: u.slug } });
    if (product) {
      await prisma.product.update({
        where: { slug: u.slug },
        data: {
          description: u.description,
          longDescription: u.longDescription,
        },
      });
      console.log(`  + ${u.name} (${u.longDescription.length}c)`);
      updated++;
    } else {
      console.log(`  ? ${u.name} non trouve (slug: ${u.slug})`);
    }
  }

  console.log(`\n${updated}/${updates.length} tarots mis a jour avec descriptions completes.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
