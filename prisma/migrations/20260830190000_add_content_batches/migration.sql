-- Génération de masse : lots (ContentBatch) + items à générer (ContentBatchItem).
CREATE TABLE "ContentBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "serieKey" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'EN_COURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentBatch_organizationId_status_idx" ON "ContentBatch"("organizationId", "status");

CREATE TABLE "ContentBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sourceId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBatchItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentBatchItem_postId_key" ON "ContentBatchItem"("postId");

CREATE INDEX "ContentBatchItem_status_batchId_idx" ON "ContentBatchItem"("status", "batchId");

ALTER TABLE "ContentBatchItem" ADD CONSTRAINT "ContentBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ContentBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lot d'origine d'une publication générée (référence souple).
ALTER TABLE "SocialPost" ADD COLUMN "batchId" TEXT;
