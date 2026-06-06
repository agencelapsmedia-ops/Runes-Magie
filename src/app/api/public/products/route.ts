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
    const products = await prisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // On masque (rend invisibles) les produits sans image dans la boutique :
    // liste, produits liés et page détail s'appuient tous sur cet endpoint.
    const visibles = products.filter((p) => aUneImage(p.image));

    return NextResponse.json(visibles);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
