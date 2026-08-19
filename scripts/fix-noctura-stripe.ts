/**
 * Correctif ponctuel (2026-08-19) : la propriétaire Noctura avait un compte
 * Stripe Express connecté (acct_1TfRwq5UKumEzHpa, créé au profil Jonathan
 * Laplante, versant vers un compte CIBC fermé). On le déconnecte pour que
 * 100 % des paiements Stripe de ses séances restent sur le compte principal.
 *
 * Usage : npx tsx scripts/fix-noctura-stripe.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const noctura = await prisma.practitioner.findFirst({
    where: { isOwner: true },
    select: { id: true, slug: true, stripeAccountId: true, stripeAccountReady: true, commissionPct: true },
  });
  if (!noctura) throw new Error('Praticienne propriétaire introuvable.');

  console.log('Avant :', noctura);

  const updated = await prisma.practitioner.update({
    where: { id: noctura.id },
    data: { stripeAccountId: null, stripeAccountReady: false, commissionPct: 0 },
    select: { id: true, slug: true, stripeAccountId: true, stripeAccountReady: true, commissionPct: true },
  });

  console.log('Après :', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
