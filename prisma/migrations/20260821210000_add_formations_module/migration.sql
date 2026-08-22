-- AlterTable
ALTER TABLE "HolisticAppointment" ADD COLUMN     "formationCourseId" TEXT,
ADD COLUMN     "formationEnrollmentId" TEXT;

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "defaultPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationCourse" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isExam" BOOLEAN NOT NULL DEFAULT false,
    "countsAsCredit" BOOLEAN NOT NULL DEFAULT true,
    "isSpecializationSlot" BOOLEAN NOT NULL DEFAULT false,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FormationCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationEnrollment" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalPrice" DOUBLE PRECISION,
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormationEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentCourseProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "unlockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'AUTO',
    "note" TEXT NOT NULL DEFAULT '',
    "chosenCourseId" TEXT,

    CONSTRAINT "EnrollmentCourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationCreditTransaction" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormationCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationPayment" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "installmentNo" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationCourseDocument" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "storagePath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormationCourseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationAuditLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'SYSTEM',
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Formation_code_key" ON "Formation"("code");

-- CreateIndex
CREATE INDEX "FormationCourse_formationId_sortOrder_idx" ON "FormationCourse"("formationId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FormationCourse_formationId_code_key" ON "FormationCourse"("formationId", "code");

-- CreateIndex
CREATE INDEX "FormationEnrollment_clientId_idx" ON "FormationEnrollment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "FormationEnrollment_formationId_clientId_key" ON "FormationEnrollment"("formationId", "clientId");

-- CreateIndex
CREATE INDEX "EnrollmentCourseProgress_enrollmentId_state_idx" ON "EnrollmentCourseProgress"("enrollmentId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentCourseProgress_enrollmentId_courseId_key" ON "EnrollmentCourseProgress"("enrollmentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "FormationCreditTransaction_appointmentId_key" ON "FormationCreditTransaction"("appointmentId");

-- CreateIndex
CREATE INDEX "FormationCreditTransaction_enrollmentId_idx" ON "FormationCreditTransaction"("enrollmentId");

-- CreateIndex
CREATE INDEX "FormationPayment_enrollmentId_idx" ON "FormationPayment"("enrollmentId");

-- CreateIndex
CREATE INDEX "FormationCourseDocument_courseId_sortOrder_idx" ON "FormationCourseDocument"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "FormationAuditLog_enrollmentId_createdAt_idx" ON "FormationAuditLog"("enrollmentId", "createdAt");

-- CreateIndex
CREATE INDEX "HolisticAppointment_formationEnrollmentId_idx" ON "HolisticAppointment"("formationEnrollmentId");

-- AddForeignKey
ALTER TABLE "HolisticAppointment" ADD CONSTRAINT "HolisticAppointment_formationEnrollmentId_fkey" FOREIGN KEY ("formationEnrollmentId") REFERENCES "FormationEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationCourse" ADD CONSTRAINT "FormationCourse_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationEnrollment" ADD CONSTRAINT "FormationEnrollment_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationEnrollment" ADD CONSTRAINT "FormationEnrollment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "HolisticUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentCourseProgress" ADD CONSTRAINT "EnrollmentCourseProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "FormationEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentCourseProgress" ADD CONSTRAINT "EnrollmentCourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "FormationCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationCreditTransaction" ADD CONSTRAINT "FormationCreditTransaction_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "FormationEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationPayment" ADD CONSTRAINT "FormationPayment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "FormationEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationCourseDocument" ADD CONSTRAINT "FormationCourseDocument_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "FormationCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationAuditLog" ADD CONSTRAINT "FormationAuditLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "FormationEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

