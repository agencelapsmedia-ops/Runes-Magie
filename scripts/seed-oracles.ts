import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface OracleData {
  slug: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  category: string;
  image: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
  tags: string[];
}

async function main() {
  const dataPath = path.join(__dirname, 'oracles-data.json');
  const oracles: OracleData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Insertion de ${oracles.length} oracles...`);

  for (const oracle of oracles) {
    const existing = await prisma.product.findUnique({ where: { slug: oracle.slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug: oracle.slug },
        data: {
          name: oracle.name,
          price: oracle.price,
          description: oracle.description,
          longDescription: oracle.longDescription,
          category: oracle.category,
          image: oracle.image,
          images: oracle.images,
          inStock: oracle.inStock,
          tags: oracle.tags,
        },
      });
      console.log(`  ~ ${oracle.name} mis a jour (${oracle.images.length} photos)`);
    } else {
      await prisma.product.create({ data: oracle });
      console.log(`  + ${oracle.name} cree (${oracle.images.length} photos)`);
    }
  }

  const count = await prisma.product.count({ where: { category: 'tarot' } });
  console.log(`\nTermine ! ${count} produits tarot/oracle au total.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
