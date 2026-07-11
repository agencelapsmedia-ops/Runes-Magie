-- CreateTable: notes de texte des tâches to-do
CREATE TABLE "TodoNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fichiers joints des tâches to-do
CREATE TABLE "TodoAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoNote_taskId_createdAt_idx" ON "TodoNote"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TodoAttachment_taskId_createdAt_idx" ON "TodoAttachment"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "TodoNote" ADD CONSTRAINT "TodoNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoAttachment" ADD CONSTRAINT "TodoAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
