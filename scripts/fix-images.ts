import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.product.findFirst({ where: { name: { contains: 'Verseau' } } });
  if (v) {
    await prisma.product.update({
      where: { id: v.id },
      data: {
        image: "/images/products/Le Tarot de l\u2019\u00C8re du Verseau 1.webp",
        images: ["/images/products/Le Tarot de l\u2019\u00C8re du Verseau 1.webp", "/images/products/Le Tarot de l\u2019\u00C8re du Verseau 2.webp"],
      },
    });
    console.log('Verseau OK - ' + v.name);
  } else {
    console.log('Verseau non trouve');
  }

  const s = await prisma.product.findFirst({ where: { name: { contains: 'Sang' } } });
  if (s) {
    await prisma.product.update({
      where: { id: s.id },
      data: {
        image: "/images/products/Tarot du Sang de l\u2019Ombre.webp",
        images: ["/images/products/Tarot du Sang de l\u2019Ombre.webp", "/images/products/Tarot du Sang de l\u2019Ombre 3.webp"],
      },
    });
    console.log('Sang OK - ' + s.name);
  } else {
    console.log('Sang non trouve');
  }

  // Also fix Le Tarot Interdit - use the best image
  const t = await prisma.product.findFirst({ where: { name: { contains: 'Interdit' } } });
  if (t) {
    await prisma.product.update({
      where: { id: t.id },
      data: {
        image: "/images/products/Le_tarot_interdit_1.jpg",
        images: ["/images/products/Le_tarot_interdit_1.jpg", "/images/products/Le_Tarot_Interditfinal_2.jpg", "/images/products/Le_tarot_interdit-3.png"],
      },
    });
    console.log('Interdit OK - ' + t.name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
