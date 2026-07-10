import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Indique si un produit possède une vraie image.
 * Le champ `Product.image` est un String requis : « sans image » signifie donc
 * une valeur vide, des espaces seulement, ou un chemin placeholder.
 */
function aUneImage(image: string | null | undefined): boolean {
  if (!image) return false;
  const v = image.trim();
  if (v === "") return false;
  if (v.toLowerCase().includes("placeholder")) return false;
  return true;
}

export async function GET() {
  try {
    const [products, inactiveCategories] = await Promise.all([
      prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
      prisma.category.findMany({ where: { isActive: false }, select: { slug: true } }),
    ]);

    // Slugs des catégories désactivées → leurs produits sont masqués de la boutique.
    const inactiveSlugs = new Set(inactiveCategories.map((c) => c.slug));

    // On masque (rend invisibles) les produits sans image ET ceux dont la catégorie
    // est désactivée. Liste, produits liés et page détail s'appuient sur cet endpoint.
    const visibles = products.filter((p) => aUneImage(p.image) && !inactiveSlugs.has(p.category));

    return NextResponse.json(visibles);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
