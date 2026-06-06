-- CreateTable
CREATE TABLE "SitePage" (
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

-- CreateIndex
CREATE UNIQUE INDEX "SitePage_slug_key" ON "SitePage"("slug");

-- CreateIndex
CREATE INDEX "SitePage_slug_idx" ON "SitePage"("slug");

-- CreateIndex
CREATE INDEX "SitePage_sortOrder_idx" ON "SitePage"("sortOrder");
