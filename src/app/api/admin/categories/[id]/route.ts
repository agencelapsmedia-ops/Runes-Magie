import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import {
  tryUpdateCategoryInClover,
  tryDeleteCategoryInClover,
  isCloverConfigured,
} from "@/lib/clover-queue";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;
  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.description === 'string') data.description = body.description;
    if (typeof body.displayOrder === 'number') data.displayOrder = body.displayOrder;
    if (typeof body.slug === 'string' && body.slug.trim()) {
      const newSlug = slugify(body.slug);
      const existing = await prisma.category.findUnique({ where: { slug: newSlug } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Slug déjà utilisé" }, { status: 409 });
      }
      data.slug = newSlug;
    }
    if (typeof body.cloverCategoryId === 'string' || body.cloverCategoryId === null) {
      data.cloverCategoryId = body.cloverCategoryId || null;
    }

    // Récupérer l'ancien slug avant update pour propager aux produits
    const before = await prisma.category.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });

    const category = await prisma.category.update({ where: { id }, data });

    // Si le slug change, propager aux produits liés
    if (data.slug && data.slug !== before.slug) {
      await prisma.product.updateMany({
        where: { category: before.slug },
        data: { category: category.slug },
      });
    }

    // Propager au Clover si lié
    let cloverSyncStatus: 'synced' | 'queued' | 'skipped' = 'skipped';
    if (isCloverConfigured() && category.cloverCategoryId) {
      const cloverUpdate: { name?: string; sortOrder?: number } = {};
      if (data.name !== undefined) cloverUpdate.name = category.name;
      if (data.displayOrder !== undefined) cloverUpdate.sortOrder = category.displayOrder;
      if (Object.keys(cloverUpdate).length > 0) {
        const ok = await tryUpdateCategoryInClover({
          cloverCategoryId: category.cloverCategoryId,
          data: cloverUpdate,
          categoryId: category.id,
        });
        cloverSyncStatus = ok ? 'synced' : 'queued';
      }
    }

    return NextResponse.json({ ...category, _cloverSyncStatus: cloverSyncStatus });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;
  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 });

    // Bloquer la suppression si des produits référencent ce slug
    const linked = await prisma.product.count({ where: { category: category.slug } });
    if (linked > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer : ${linked} produit(s) utilisent cette catégorie. Réassignez-les d'abord.`,
          linkedProducts: linked,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    // Propager au Clover si lié
    if (isCloverConfigured() && category.cloverCategoryId) {
      await tryDeleteCategoryInClover({
        cloverCategoryId: category.cloverCategoryId,
        categoryId: category.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
