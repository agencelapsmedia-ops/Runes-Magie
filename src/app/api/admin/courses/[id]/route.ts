import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

// GET — un cours avec ses leçons (pour l'édition).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true } },
      lessons: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!course) {
    return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
  }
  return NextResponse.json(course);
}

// PUT — met à jour les champs du cours.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.coverUrl === "string" || body.coverUrl === null) data.coverUrl = body.coverUrl || null;
    if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;

    const course = await prisma.course.update({ where: { id }, data });
    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — supprime le cours (et ses leçons en cascade).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  try {
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
