-- CreateTable: actions réalisées par Laps Media (registre facturable)
CREATE TABLE "LapsAction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "doneOn" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 74.99,
    "todoTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LapsAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: paiements d'Annabelle à Laps Media (réduisent le solde dû)
CREATE TABLE "LapsPayment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidOn" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'INTERAC',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LapsPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LapsAction_doneOn_idx" ON "LapsAction"("doneOn");
CREATE INDEX "LapsAction_billable_idx" ON "LapsAction"("billable");
CREATE INDEX "LapsPayment_paidOn_idx" ON "LapsPayment"("paidOn");

-- AddForeignKey: la suppression d'une tâche du kanban ne doit pas effacer une
-- action déjà facturée — le lien est simplement oublié.
ALTER TABLE "LapsAction" ADD CONSTRAINT "LapsAction_todoTaskId_fkey" FOREIGN KEY ("todoTaskId") REFERENCES "TodoTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
