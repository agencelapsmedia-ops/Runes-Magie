-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "pricePerBlock10" DOUBLE PRECISION,
ADD COLUMN     "pricePerCourse" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FormationCreditTransaction" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "enrollmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "FormationCreditTransaction" ADD CONSTRAINT "FormationCreditTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "HolisticUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

