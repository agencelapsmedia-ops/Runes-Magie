import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { generateSku, findUniqueSku } from "@/lib/clover-sku";
import { tryCreateInClover, isCloverConfigured } from "@/lib/clover-queue";

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
    const {
      name,
      price,
      description,
      longDescription,
      category,
      subcategory,
      stone,
      author,
      content,
      format,
      isbn,
      image,
      images,
      inStock,
      featured,
      tags,
      sku,
      stockQuantity,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Les champs name et category sont requis" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    // SKU : utiliser celui fourni, sinon auto-générer
    let finalSku: string | null = null;
    if (typeof sku === 'string' && sku.trim()) {
      finalSku = sku.trim();
    } else {
      // Génère un SKU unique de la forme RM-CRIST-AMT-001
      const baseSku = generateSku(name, category);
      finalSku = await findUniqueSku(baseSku);
    }

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
        author: author || null,
        content: content || null,
        format: format || null,
        isbn: isbn || null,
        checkoutType: body.checkoutType || "stripe",
        image: image || "",
        images: images || [],
        inStock: inStock ?? true,
        featured: featured ?? false,
        tags: tags || [],
        sku: finalSku,
        stockQuantity: typeof stockQuantity === 'number' ? stockQuantity : null,
      },
    });

    // Tentative de push vers Clover (best-effort, mis en queue si échec)
    let cloverSyncStatus: 'synced' | 'queued' | 'skipped' = 'skipped';
    if (isCloverConfigured()) {
      const cloverId = await tryCreateInClover({
        productId: product.id,
        name: product.name,
        priceCents: Math.round(product.price * 100),
        sku: product.sku,
        category: product.category,
        description: product.description,
      });
      cloverSyncStatus = cloverId ? 'synced' : 'queued';
    }

    return NextResponse.json({ ...product, _cloverSyncStatus: cloverSyncStatus }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
