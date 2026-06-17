-- AlterTable: mode de paiement des RDV manuels (colonne additive nullable)
ALTER TABLE "HolisticAppointment" ADD COLUMN "paymentMode" TEXT;
