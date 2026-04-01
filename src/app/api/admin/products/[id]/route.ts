import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: "Produit non trouve" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
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

    if (body.name !== undefined) { data.name = body.name; data.slug = slugify(body.name); }
    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.description !== undefined) data.description = body.description;
    if (body.longDescription !== undefined) data.longDescription = body.longDescription;
    if (body.category !== undefined) data.category = body.category;
    if (body.subcategory !== undefined) data.subcategory = body.subcategory || null;
    if (body.stone !== undefined) data.stone = body.stone || null;
    if (body.author !== undefined) data.author = body.author || null;
    if (body.content !== undefined) data.content = body.content || null;
    if (body.format !== undefined) data.format = body.format || null;
    if (body.isbn !== undefined) data.isbn = body.isbn || null;
    if (body.image !== undefined) data.image = body.image;
    if (body.images !== undefined) data.images = body.images;
    if (body.inStock !== undefined) data.inStock = body.inStock;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.tags !== undefined) data.tags = body.tags;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
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
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
