-- AlterTable: marqueurs anti-doublon des rappels client (colonnes additives nullables)
ALTER TABLE "HolisticAppointment" ADD COLUMN     "reminder3dSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder24hSentAt" TIMESTAMP(3);
