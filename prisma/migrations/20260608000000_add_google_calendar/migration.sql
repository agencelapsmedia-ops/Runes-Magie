-- AlterTable: Google Agenda OAuth par praticienne (champs additifs nullables)
ALTER TABLE "Practitioner" ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleCalendarEmail" TEXT,
ADD COLUMN     "googleCalendarConnectedAt" TIMESTAMP(3);

-- AlterTable: id de l'evenement Google lie a un RDV (sync sortante)
ALTER TABLE "HolisticAppointment" ADD COLUMN     "googleEventId" TEXT;
