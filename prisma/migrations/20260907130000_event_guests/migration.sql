-- CreateTable: accompagnateurs amenés par une inscrite (sans compte sur le site)
CREATE TABLE "EventGuest" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "attendance" TEXT,
    "attendanceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventGuest_registrationId_idx" ON "EventGuest"("registrationId");

-- AddForeignKey: annuler ou supprimer une inscription emporte ses accompagnateurs.
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
