-- Pages éditoriales du site, éditables en ligne par l'admin.
--
-- « IF NOT EXISTS » est délibéré : cette table existe déjà dans la base de
-- production, créée hors migration par un `prisma db push` d'une session
-- antérieure puis oubliée (aucune migration ne la déclarait, aucun code ne
-- l'utilisait, 0 ligne). Sans cette précaution, `prisma migrate deploy`
-- échouerait au déploiement sur « relation already exists ». Sur une base
-- neuve, la table est créée normalement.
CREATE TABLE IF NOT EXISTS "SitePage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'standard',
    "content" JSONB NOT NULL DEFAULT '{}',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SitePage_slug_key" ON "SitePage"("slug");
CREATE INDEX IF NOT EXISTS "SitePage_slug_idx" ON "SitePage"("slug");
CREATE INDEX IF NOT EXISTS "SitePage_sortOrder_idx" ON "SitePage"("sortOrder");
