-- CreateTable: to-do du projet (kanban admin)
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

-- CreateIndex
CREATE INDEX "TodoTask_status_sortOrder_idx" ON "TodoTask"("status", "sortOrder");
