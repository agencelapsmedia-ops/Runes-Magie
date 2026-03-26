import { PrismaClient } from '@prisma/client';
import { products } from '../src/data/products';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        description: p.description,
        longDescription: p.longDescription,
        category: p.category,
        image: p.image,
        images: p.images,
        inStock: p.inStock,
        featured: p.featured,
        tags: p.tags,
      },
      create: {
        slug: p.slug,
        name: p.name,
        price: p.price,
        description: p.description,
        longDescription: p.longDescription,
        category: p.category,
        image: p.image,
        images: p.images,
        inStock: p.inStock,
        featured: p.featured,
        tags: p.tags,
      },
    });
    console.log(`  -> ${p.name}`);
  }

  console.log(`Done! ${products.length} products seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
