-- Pointage des présences aux rituels : null = pas encore pointé, sinon PRESENT | ABSENT.
ALTER TABLE "EventRegistration" ADD COLUMN "attendance" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN "attendanceAt" TIMESTAMP(3);
