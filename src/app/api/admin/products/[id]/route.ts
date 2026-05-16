import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { tryUpdateInClover, tryDeleteInClover, isCloverConfigured } from "@/lib/clover-queue";
import { setCloverItemStock } from "@/lib/clover";

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
    if (body.checkoutType !== undefined) data.checkoutType = body.checkoutType || "stripe";
    if (body.image !== undefined) data.image = body.image;
    if (body.images !== undefined) data.images = body.images;
    if (body.inStock !== undefined) data.inStock = body.inStock;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.sku !== undefined) data.sku = body.sku || null;
    if (body.stockQuantity !== undefined) data.stockQuantity = body.stockQuantity;
    if (body.productType !== undefined) data.productType = body.productType;
    if (body.syncToClover !== undefined) data.syncToClover = body.syncToClover;
    if (body.downloadUrl !== undefined) data.downloadUrl = body.downloadUrl || null;
    if (body.courseAccessSlug !== undefined) data.courseAccessSlug = body.courseAccessSlug || null;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // Propager update vers Clover seulement si syncToClover=true ET produit déjà lié
    let cloverSyncStatus: 'synced' | 'queued' | 'skipped' = 'skipped';
    if (isCloverConfigured() && product.cloverId && product.syncToClover) {
      // Détermine ce qui change côté Clover (nom, prix, sku, masqué)
      const cloverUpdate: {
        name?: string;
        priceCents?: number;
        sku?: string | null;
        alternateName?: string;
        hidden?: boolean;
      } = {};
      if (body.name !== undefined) cloverUpdate.name = product.name;
      if (body.price !== undefined) cloverUpdate.priceCents = Math.round(product.price * 100);
      if (body.sku !== undefined) cloverUpdate.sku = product.sku;
      if (body.description !== undefined) cloverUpdate.alternateName = product.description;
      if (body.inStock !== undefined) cloverUpdate.hidden = !product.inStock;

      if (Object.keys(cloverUpdate).length > 0) {
        const ok = await tryUpdateInClover(id, { cloverId: product.cloverId, data: cloverUpdate });
        cloverSyncStatus = ok ? 'synced' : 'queued';
      }

      // Propage le stockQuantity séparément (endpoint dédié)
      if (body.stockQuantity !== undefined && product.stockQuantity != null) {
        try {
          await setCloverItemStock(product.cloverId, product.stockQuantity);
        } catch (err) {
          console.error('[products/PUT] setCloverItemStock échec', { productId: id, err });
          cloverSyncStatus = 'queued';
        }
      }
    }

    return NextResponse.json({ ...product, _cloverSyncStatus: cloverSyncStatus });
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
    // On lit le cloverId AVANT de supprimer pour pouvoir le propager
    const product = await prisma.product.findUnique({
      where: { id },
      select: { cloverId: true },
    });

    await prisma.product.delete({ where: { id } });

    if (isCloverConfigured() && product?.cloverId) {
      await tryDeleteInClover(id, { cloverId: product.cloverId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
