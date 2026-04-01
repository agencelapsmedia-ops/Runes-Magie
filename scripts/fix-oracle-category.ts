import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const oracles = JSON.parse(fs.readFileSync('scripts/oracles-data.json', 'utf-8'));
  const slugs = oracles.map((o: any) => o.slug);

  const result = await prisma.product.updateMany({
    where: { slug: { in: slugs } },
    data: { category: 'oracle' },
  });
  console.log(`${result.count} oracles mis a jour vers categorie 'oracle'`);

  const countT = await prisma.product.count({ where: { category: 'tarot' } });
  const countO = await prisma.product.count({ where: { category: 'oracle' } });
  console.log(`Tarots: ${countT}, Oracles: ${countO}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
