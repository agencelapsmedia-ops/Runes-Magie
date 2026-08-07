-- Tuiles de la grille « application » de la page d'accueil.
-- Purement additif : aucune table existante n'est touchée.
CREATE TABLE "HomeTile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "iconKey" TEXT NOT NULL DEFAULT 'etoile',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "imageFocus" TEXT NOT NULL DEFAULT 'center',
    "href" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'CARTE',
    "chips" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeTile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomeTile_slug_key" ON "HomeTile"("slug");
CREATE INDEX "HomeTile_sortOrder_idx" ON "HomeTile"("sortOrder");
