import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessibleLesson } from "@/lib/courses";

/**
 * POST /api/membre/progress
 * Body : { lessonId: string, status?: "IN_PROGRESS" | "COMPLETED" }
 * Met à jour la progression du membre sur une leçon. L'accès est vérifié via
 * l'entitlement du cours. Une leçon déjà COMPLETED n'est jamais rétrogradée.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Restreint aux membres (HolisticUser) — pas aux AdminUser.
  const member = await prisma.holisticUser.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { lessonId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : null;
  const status = body.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS";
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId requis" }, { status: 400 });
  }

  const access = await getAccessibleLesson(userId, lessonId);
  if (!access) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.courseProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, courseId: access.courseId, status, lastViewedAt: new Date() },
    // Un IN_PROGRESS ne doit pas écraser un COMPLETED existant.
    update:
      status === "COMPLETED"
        ? { status: "COMPLETED", lastViewedAt: new Date() }
        : { lastViewedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
