import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

/** Génère un slug unique pour un Course à partir d'une base. */
async function uniqueCourseSlug(base: string): Promise<string> {
  const root = slugify(base) || "cours";
  let slug = root;
  let n = 2;
  while (await prisma.course.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

// GET — liste des cours (+ produits COURSE encore sans cours, pour la création).
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const courses = await prisma.course.findMany({
      include: {
        product: { select: { id: true, name: true } },
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const linkedProductIds = new Set(courses.map((c) => c.productId));
    const courseProducts = await prisma.product.findMany({
      where: { productType: "COURSE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    const availableProducts = courseProducts.filter((p) => !linkedProductIds.has(p.id));

    return NextResponse.json({ courses, availableProducts });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — crée un cours rattaché à un produit COURSE.
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await request.json();
    const { productId, title, description, coverUrl, isPublished } = body;

    if (!productId || !title) {
      return NextResponse.json(
        { error: "productId et title sont requis" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, productType: true, course: { select: { id: true } } },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    if (product.productType !== "COURSE") {
      return NextResponse.json(
        { error: "Le produit doit être de type COURSE" },
        { status: 400 },
      );
    }
    if (product.course) {
      return NextResponse.json(
        { error: "Ce produit a déjà un cours" },
        { status: 409 },
      );
    }

    const course = await prisma.course.create({
      data: {
        productId,
        slug: await uniqueCourseSlug(title),
        title,
        description: description || "",
        coverUrl: coverUrl || null,
        isPublished: Boolean(isPublished),
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
