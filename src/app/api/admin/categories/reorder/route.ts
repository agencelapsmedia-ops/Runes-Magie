import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tryUpdateCategoryInClover, isCloverConfigured } from "@/lib/clover-queue";

/**
 * POST /api/admin/categories/reorder
 *
 * Body : { orderedIds: string[] }
 *
 * Met à jour le displayOrder de chaque catégorie selon sa position dans le tableau,
 * en incréments de 10 (10, 20, 30, ...). Cela laisse de la marge pour insertions futures.
 *
 * Propage le nouvel ordre à Clover si la catégorie y est liée.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds doit être un tableau non vide" }, { status: 400 });
    }

    const cloverEnabled = isCloverConfigured();
    const updated: Array<{ id: string; displayOrder: number; cloverSync: 'synced' | 'queued' | 'skipped' }> = [];

    // Met à jour séquentiellement (séries petites — pas besoin de transaction lourde)
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const newOrder = (i + 1) * 10;

      const category = await prisma.category.update({
        where: { id },
        data: { displayOrder: newOrder },
      });

      let cloverSync: 'synced' | 'queued' | 'skipped' = 'skipped';
      if (cloverEnabled && category.cloverCategoryId) {
        const ok = await tryUpdateCategoryInClover({
          cloverCategoryId: category.cloverCategoryId,
          data: { sortOrder: newOrder },
          categoryId: category.id,
        });
        cloverSync = ok ? 'synced' : 'queued';
      }

      updated.push({ id: category.id, displayOrder: newOrder, cloverSync });
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
