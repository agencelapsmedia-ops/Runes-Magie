-- Kit To-do Kanban — migration Postgres (fallback si tu n'utilises pas `prisma migrate dev`).

-- CreateTable
CREATE TABLE "TodoTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "priority" TEXT NOT NULL DEFAULT 'MOYENNE',
    "label" TEXT,
    "assignee" TEXT,
    "startsOn" TIMESTAMP(3),
    "dueOn" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoTask_status_sortOrder_idx" ON "TodoTask"("status", "sortOrder");
CREATE INDEX "TodoNote_taskId_createdAt_idx" ON "TodoNote"("taskId", "createdAt");
CREATE INDEX "TodoAttachment_taskId_createdAt_idx" ON "TodoAttachment"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "TodoNote" ADD CONSTRAINT "TodoNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoAttachment" ADD CONSTRAINT "TodoAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TodoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
