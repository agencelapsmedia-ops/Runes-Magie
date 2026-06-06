import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

/** Slug unique pour une leçon au sein d'un cours. */
async function uniqueLessonSlug(courseId: string, base: string): Promise<string> {
  const root = slugify(base) || "lecon";
  let slug = root;
  let n = 2;
  while (
    await prisma.lesson.findUnique({
      where: { courseId_slug: { courseId, slug } },
      select: { id: true },
    })
  ) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

// POST — ajoute une leçon au cours.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id: courseId } = await params;
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const { title, videoUrl, content, durationMin, isPreview } = body;
    if (!title) {
      return NextResponse.json({ error: "title requis" }, { status: 400 });
    }

    const last = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        slug: await uniqueLessonSlug(courseId, title),
        title,
        videoUrl: videoUrl || null,
        content: content || "",
        durationMin: typeof durationMin === "number" ? durationMin : null,
        isPreview: Boolean(isPreview),
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
