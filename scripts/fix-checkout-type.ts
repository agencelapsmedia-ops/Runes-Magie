import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check current state
  const all = await prisma.product.findMany({ select: { id: true, name: true, checkoutType: true } });
  const stripe = all.filter(p => p.checkoutType === 'stripe').length;
  const email = all.filter(p => p.checkoutType === 'email').length;
  const other = all.filter(p => p.checkoutType !== 'stripe' && p.checkoutType !== 'email').length;
  console.log(`Total: ${all.length} | Stripe: ${stripe} | Email: ${email} | Other/null: ${other}`);

  if (other > 0) {
    console.log('\nProduits sans checkoutType valide:');
    all.filter(p => p.checkoutType !== 'stripe' && p.checkoutType !== 'email')
       .forEach(p => console.log(`  - ${p.name}: "${p.checkoutType}"`));
  }

  // Fix: set all products without valid checkoutType to "stripe"
  const result = await prisma.product.updateMany({
    where: {
      NOT: {
        checkoutType: { in: ['stripe', 'email'] }
      }
    },
    data: { checkoutType: 'stripe' },
  });
  console.log(`\n${result.count} produits corriges vers "stripe"`);

  // Also ensure ALL products have checkoutType = stripe by default
  const result2 = await prisma.product.updateMany({
    where: { checkoutType: '' },
    data: { checkoutType: 'stripe' },
  });
  console.log(`${result2.count} produits vides corriges`);

  // Final count
  const finalStripe = await prisma.product.count({ where: { checkoutType: 'stripe' } });
  const finalEmail = await prisma.product.count({ where: { checkoutType: 'email' } });
  console.log(`\nFinal: ${finalStripe} Stripe, ${finalEmail} Email`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
