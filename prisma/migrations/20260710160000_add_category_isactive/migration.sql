-- AlterTable: activation/masquage d'une catégorie de produits sur la boutique publique
ALTER TABLE "Category" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
