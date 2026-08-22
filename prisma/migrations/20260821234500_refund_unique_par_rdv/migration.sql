-- AlterTable
ALTER TABLE "FormationCreditTransaction" ADD COLUMN     "refundOfAppointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FormationCreditTransaction_refundOfAppointmentId_key" ON "FormationCreditTransaction"("refundOfAppointmentId");

