-- AVANT D'APPLIQUER : lancer `npm run db:migrate:isbn-to-sku` pour copier
-- la valeur isbn vers sku sur les produits où sku est null. Sans ça, la
-- donnée ISBN sera perdue.

-- DropColumn
ALTER TABLE "Product" DROP COLUMN "isbn";
