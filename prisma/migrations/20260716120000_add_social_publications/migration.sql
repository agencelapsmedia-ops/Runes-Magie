-- CreateTable : comptes réseaux sociaux connectés (token chiffré AES-256-GCM)
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL DEFAULT 'runes-et-magie',
    "network" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "tokenLastFour" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestSucceeded" BOOLEAN,
    "lastTestError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable : publications (contenu de base + déclinaisons par réseau)
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL DEFAULT 'runes-et-magie',
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PUBLICATION',
    "baseText" TEXT NOT NULL DEFAULT '',
    "callToAction" TEXT NOT NULL DEFAULT '',
    "link" TEXT,
    "hashtags" TEXT NOT NULL DEFAULT '',
    "images" JSONB NOT NULL DEFAULT '[]',
    "variants" JSONB NOT NULL DEFAULT '{}',
    "complianceReport" JSONB,
    "status" TEXT NOT NULL DEFAULT 'BROUILLON',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable : comptes ciblés par une publication
CREATE TABLE "SocialPostTarget" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SocialPostTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable : jobs de publication (une tentative par compte, historique + erreurs)
CREATE TABLE "SocialPublishJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL DEFAULT 'runes-et-magie',
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorCategory" TEXT,
    "lastHttpStatus" INTEGER,
    "lastError" TEXT,
    "externalPostId" TEXT,
    "startedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPublishJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_organizationId_network_externalId_key" ON "SocialAccount"("organizationId", "network", "externalId");
CREATE INDEX "SocialAccount_organizationId_network_isActive_idx" ON "SocialAccount"("organizationId", "network", "isActive");
CREATE INDEX "SocialPost_organizationId_status_scheduledAt_idx" ON "SocialPost"("organizationId", "status", "scheduledAt");
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");
CREATE UNIQUE INDEX "SocialPostTarget_postId_accountId_key" ON "SocialPostTarget"("postId", "accountId");
CREATE UNIQUE INDEX "SocialPublishJob_postId_accountId_key" ON "SocialPublishJob"("postId", "accountId");
CREATE INDEX "SocialPublishJob_status_nextAttemptAt_idx" ON "SocialPublishJob"("status", "nextAttemptAt");
CREATE INDEX "SocialPublishJob_postId_idx" ON "SocialPublishJob"("postId");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialPostTarget" ADD CONSTRAINT "SocialPostTarget_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPostTarget" ADD CONSTRAINT "SocialPostTarget_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPublishJob" ADD CONSTRAINT "SocialPublishJob_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialPublishJob" ADD CONSTRAINT "SocialPublishJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
