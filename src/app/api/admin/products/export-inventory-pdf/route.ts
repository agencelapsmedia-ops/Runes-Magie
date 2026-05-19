import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { renderToBuffer } from '@react-pdf/renderer';
import { InventoryPdf, type InventoryPdfProduct } from '@/lib/pdf/InventoryPdf';

/**
 * GET /api/admin/products/export-inventory-pdf
 *
 * Génère un PDF de l'inventaire des produits.
 *
 * Query params (filtres optionnels, respectent ceux de la grille) :
 *   - ?category=<slug>   : filtre par catégorie
 *   - ?search=<texte>    : filtre par nom (contains, case-insensitive)
 *   - ?visible=true      : seulement les inStock=true
 *   - ?visible=false     : seulement les inStock=false (cachés)
 *
 * Retourne application/pdf en téléchargement (Content-Disposition: attachment).
 */
export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const category = url.searchParams.get('category')?.trim() || null;
  const search = url.searchParams.get('search')?.trim() || null;
  const visibleParam = url.searchParams.get('visible');

  // Build Prisma where clause
  const where: {
    category?: string;
    name?: { contains: string; mode: 'insensitive' };
    inStock?: boolean;
  } = {};
  if (category) where.category = category;
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (visibleParam === 'true') where.inStock = true;
  if (visibleParam === 'false') where.inStock = false;

  const products = await prisma.product.findMany({
    where,
    select: {
      sku: true,
      name: true,
      category: true,
      productType: true,
      price: true,
      stockQuantity: true,
      inStock: true,
      cloverId: true,
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  // Construit le label du filtre pour affichage dans le PDF
  const filterParts: string[] = [];
  if (category) filterParts.push(`Catégorie : ${category}`);
  if (search) filterParts.push(`Recherche : "${search}"`);
  if (visibleParam === 'true') filterParts.push('Visibles uniquement');
  if (visibleParam === 'false') filterParts.push('Cachés uniquement');
  const filterLabel = filterParts.length > 0 ? filterParts.join(' · ') : undefined;

  const productsForPdf: InventoryPdfProduct[] = products.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    productType: p.productType,
    price: p.price,
    stockQuantity: p.stockQuantity,
    inStock: p.inStock,
    cloverId: p.cloverId,
  }));

  // Génère le PDF
  const buffer = await renderToBuffer(
    InventoryPdf({ products: productsForPdf, filterLabel, generatedAt: new Date() }),
  );

  // Nom de fichier avec timestamp
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `inventaire-runes-magie-${dateStr}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
