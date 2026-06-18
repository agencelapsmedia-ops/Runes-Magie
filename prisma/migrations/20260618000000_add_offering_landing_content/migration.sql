-- Ajoute le stockage des textes personnalisés de la page de présentation d'un service
ALTER TABLE "Offering" ADD COLUMN "landingContent" JSONB;
