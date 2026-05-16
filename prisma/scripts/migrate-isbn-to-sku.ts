/**
 * Migration ISBN → SKU.
 *
 * Avant de supprimer le champ `isbn` du modèle Product, on copie sa
 * valeur dans `sku` pour chaque produit où sku est null. Ainsi, pour
 * un livre, le SKU = l'ISBN, ce qui est cohérent et préserve la donnée.
 *
 * Idempotent : produits avec sku déjà rempli sont ignorés.
 *
 * Usage :
 *   npm run db:migrate:isbn-to-sku
 *
 * À exécuter AVANT d'appliquer la migration SQL qui drop la colonne isbn.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[migrate-isbn-to-sku] Recherche des produits avec isbn et sans sku...');

  // Note : on utilise une raw query car le champ isbn pourrait déjà
  // être absent du client Prisma si on régénère le client après
  // suppression du champ dans le schema. Sécurise contre les deux ordres.
  const rows: Array<{ id: string; isbn: string | null }> = await prisma.$queryRawUnsafe(
    `SELECT id, isbn FROM "Product" WHERE isbn IS NOT NULL AND isbn <> '' AND (sku IS NULL OR sku = '')`,
  );

  console.log(`[migrate-isbn-to-sku] ${rows.length} produit(s) à migrer.`);

  let migrated = 0;
  let conflicts = 0;

  for (const row of rows) {
    if (!row.isbn) continue;

    // Vérifie si l'ISBN est déjà utilisé comme SKU par un autre produit
    const existing = await prisma.product.findFirst({
      where: { sku: row.isbn, id: { not: row.id } },
      select: { id: true, name: true },
    });

    if (existing) {
      console.warn(`  ⚠ ISBN ${row.isbn} déjà utilisé comme SKU par produit ${existing.id} (${existing.name}). Skip.`);
      conflicts++;
      continue;
    }

    await prisma.product.update({
      where: { id: row.id },
      data: { sku: row.isbn },
    });
    migrated++;
    console.log(`  + produit ${row.id} : sku = "${row.isbn}"`);
  }

  console.log(`[migrate-isbn-to-sku] Terminé. ${migrated} migré(s), ${conflicts} conflit(s).`);
  console.log('[migrate-isbn-to-sku] Tu peux maintenant appliquer la migration SQL qui drop la colonne isbn.');
}

main()
  .catch((err) => {
    console.error('[migrate-isbn-to-sku] ÉCHEC :', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
