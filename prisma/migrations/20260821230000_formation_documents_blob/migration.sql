-- AlterTable
ALTER TABLE "FormationCourseDocument" ADD COLUMN     "data" BYTEA,
ADD COLUMN     "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
ADD COLUMN     "sizeBytes" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "storagePath" SET DEFAULT '';

