-- Matière première éditoriale (corpus importé du vault Obsidian par marque).
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frontmatter" JSONB NOT NULL DEFAULT '{}',
    "body" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentSource_organizationId_kind_slug_key" ON "ContentSource"("organizationId", "kind", "slug");

CREATE INDEX "ContentSource_organizationId_kind_isActive_idx" ON "ContentSource"("organizationId", "kind", "isActive");
