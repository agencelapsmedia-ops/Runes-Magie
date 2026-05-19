/**
 * Helpers SKU + mapping catégories site ↔ Clover.
 *
 * Format SKU : NNNN (4 chiffres séquentiels)
 *   - Chaque nouveau produit reçoit le prochain numéro disponible
 *   - Padding avec zéros : 0001, 0042, 0789, 9999
 *   - Max 9999 produits (largement suffisant pour la boutique)
 *
 * Migration : voir prisma/scripts/regenerate-skus.ts
 */

import { prisma } from '@/lib/db';

const SKU_PATTERN = /^\d{4}$/;
const SKU_MAX = 9999;

/**
 * Génère le prochain SKU séquentiel disponible (4 chiffres).
 * Lit la DB pour trouver le max actuel et incrémente.
 *
 * @returns SKU string format "NNNN" (ex: "0042")
 * @throws Error si on dépasse 9999 produits
 */
export async function generateSku(): Promise<string> {
  // Récupère tous les SKU au format 4 chiffres
  const allWithSku = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { sku: true },
  });

  let maxNum = 0;
  for (const p of allWithSku) {
    if (p.sku && SKU_PATTERN.test(p.sku)) {
      const n = parseInt(p.sku, 10);
      if (n > maxNum) maxNum = n;
    }
  }

  const next = maxNum + 1;
  if (next > SKU_MAX) {
    throw new Error(`SKU dépassé : déjà ${maxNum} produits avec SKU 4-chiffres. Max ${SKU_MAX}.`);
  }
  return String(next).padStart(4, '0');
}

/**
 * Vérifie qu'un SKU n'est pas déjà pris et retourne un SKU unique.
 * Si le baseSku est libre → le retourne tel quel.
 * Sinon → génère un nouveau séquentiel.
 *
 * NB : avec le nouveau format 4-chiffres, generateSku() garantit déjà l'unicité.
 * Cette fonction reste pour les cas où on accepte un SKU custom de l'utilisateur.
 */
export async function findUniqueSku(baseSku: string): Promise<string> {
  if (!baseSku) return generateSku();

  const existing = await prisma.product.findFirst({ where: { sku: baseSku } });
  if (!existing) return baseSku;

  // Collision : on génère un séquentiel à la place
  return generateSku();
}

/**
 * Map d'une catégorie site → ID(s) de catégorie(s) Clover correspondantes.
 *
 * Stratégie (V2) : lookup DIRECT dans la table Category qui contient le
 * `cloverCategoryId` pour chaque catégorie site déjà synchronisée. Plus de
 * liste hardcodée → marche automatiquement pour TOUTES les catégories
 * (nouvelles ou existantes), pas seulement les 9 de base.
 *
 * Fallback : si la catégorie n'a pas de cloverCategoryId dans la DB,
 * essaye un fuzzy match par nom dans la liste cloverCategories fournie.
 *
 * @param siteCategory - slug de la catégorie site (ex: 'cours-formations')
 * @param cloverCategories - optionnel, liste Clover pour fallback fuzzy match
 */
export async function mapSiteToCloverCategoryIds(
  siteCategory: string,
  cloverCategories?: Array<{ id: string; name: string }>,
): Promise<string[]> {
  // 1) Tentative principale : lookup direct via la table Category
  const cat = await prisma.category.findUnique({
    where: { slug: siteCategory },
    select: { cloverCategoryId: true, name: true },
  });

  if (cat?.cloverCategoryId) {
    return [cat.cloverCategoryId];
  }

  // 2) Fallback fuzzy match (si pas de cloverCategoryId en DB et liste fournie)
  if (cat && cloverCategories && cloverCategories.length > 0) {
    const target = cat.name.toLowerCase();
    for (const c of cloverCategories) {
      const lower = c.name.toLowerCase();
      if (lower === target || lower.includes(target) || target.includes(lower)) {
        return [c.id];
      }
    }
  }

  return [];
}
