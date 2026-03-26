import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, price, description, longDescription, category, subcategory, stone, image, images, inStock, featured, tags } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Les champs name et category sont requis" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        price: parseFloat(price) || 0,
        description: description || "",
        longDescription: longDescription || "",
        category,
        subcategory: subcategory || null,
        stone: stone || null,
        image: image || "",
        images: images || [],
        inStock: inStock ?? true,
        featured: featured ?? false,
        tags: tags || [],
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
