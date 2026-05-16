import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { tryCreateCategoryInClover, isCloverConfigured } from "@/lib/clover-queue";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, displayOrder, slug: bodySlug, syncToClover } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: "Le champ name est requis" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const baseSlug = (typeof bodySlug === 'string' && bodySlug.trim()) ? slugify(bodySlug) : slugify(trimmedName);

    // Garantit un slug unique : append -2, -3, ... si collision
    let finalSlug = baseSlug;
    let counter = 2;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // displayOrder par défaut : max + 10
    let finalOrder = typeof displayOrder === 'number' ? displayOrder : null;
    if (finalOrder === null) {
      const last = await prisma.category.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });
      finalOrder = (last?.displayOrder ?? 0) + 10;
    }

    const category = await prisma.category.create({
      data: {
        slug: finalSlug,
        name: trimmedName,
        description: typeof description === 'string' ? description : '',
        displayOrder: finalOrder,
      },
    });

    let cloverSyncStatus: 'synced' | 'queued' | 'skipped' = 'skipped';
    const shouldSync = syncToClover !== false; // default true
    if (shouldSync && isCloverConfigured()) {
      const cloverCategoryId = await tryCreateCategoryInClover({
        categoryId: category.id,
        name: category.name,
        sortOrder: category.displayOrder,
      });
      cloverSyncStatus = cloverCategoryId ? 'synced' : 'queued';
    }

    return NextResponse.json({ ...category, _cloverSyncStatus: cloverSyncStatus }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
