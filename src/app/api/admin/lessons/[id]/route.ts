import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

// PUT — met à jour une leçon (titre, vidéo, contenu, durée, ordre, aperçu).
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
    if (typeof body.videoUrl === "string" || body.videoUrl === null) data.videoUrl = body.videoUrl || null;
    if (typeof body.content === "string") data.content = body.content;
    if (typeof body.durationMin === "number" || body.durationMin === null) data.durationMin = body.durationMin;
    if (typeof body.isPreview === "boolean") data.isPreview = body.isPreview;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

    const lesson = await prisma.lesson.update({ where: { id }, data });
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — supprime une leçon.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  try {
    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
