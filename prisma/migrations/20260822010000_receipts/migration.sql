-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "appointmentId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PAYMENT',
    "formationPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_number_key" ON "Receipt"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_formationPaymentId_key" ON "Receipt"("formationPaymentId");

-- CreateIndex
CREATE INDEX "Receipt_clientId_paidAt_idx" ON "Receipt"("clientId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_appointmentId_kind_key" ON "Receipt"("appointmentId", "kind");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "HolisticUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

