import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface Update {
  slug: string;
  author: string | null;
  content: string | null;
  format: string | null;
  isbn: string | null;
  longDescription: string;
}

async function main() {
  const updates: Update[] = JSON.parse(fs.readFileSync('scripts/structured-fields.json', 'utf-8'));

  console.log(`Mise a jour de ${updates.length} produits avec champs structures...`);

  let updated = 0;
  for (const u of updates) {
    const product = await prisma.product.findUnique({ where: { slug: u.slug } });
    if (product) {
      await prisma.product.update({
        where: { slug: u.slug },
        data: {
          author: u.author || null,
          content: u.content || null,
          format: u.format || null,
          isbn: u.isbn || null,
          longDescription: u.longDescription,
        },
      });
      updated++;
    }
  }

  console.log(`${updated}/${updates.length} produits mis a jour.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
