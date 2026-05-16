/**
 * Helpers SKU + mapping catégories site ↔ Clover.
 *
 * Format SKU : RM-{CAT}-{NAME}-{NUM}
 *   RM     = Runes & Magie (préfixe brand)
 *   CAT    = code catégorie 3-5 lettres (CRIST, TAROT, BOUGI, etc.)
 *   NAME   = 3 premières consonnes signifiantes du nom (ex: 'Améthyste' → AMT)
 *   NUM    = nombre auto-incrémenté à 3 chiffres en cas de collision (001, 002...)
 *
 * Exemple : 'Améthyste 50g' (cristaux) → RM-CRIST-AMT-001
 */

import { prisma } from '@/lib/db';

const CATEGORY_CODES: Record<string, string> = {
  'cristaux': 'CRIST',
  'runes': 'RUNE',
  'tarot': 'TAROT',
  'oracle': 'ORACL',
  'herbes-encens': 'HERBE',
  'bougies': 'BOUGI',
  'bijoux': 'BIJOU',
  'orgonites': 'ORGON',
  'baguettes-magiques': 'BAGUE',
};

/**
 * Génère un code 3 lettres à partir du nom du produit.
 * Préfère les consonnes significatives, fallback sur les premières lettres.
 */
function nameCode(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toUpperCase()
    .replace(/[^A-Z]/g, ''); // garde uniquement A-Z

  if (normalized.length === 0) return 'XXX';
  if (normalized.length <= 3) return normalized.padEnd(3, 'X');

  // Stratégie : 1ère lettre + 2 consonnes significatives suivantes
  const first = normalized[0];
  const rest = normalized.slice(1).replace(/[AEIOUY]/g, ''); // retire voyelles
  const consonants = (first + rest).slice(0, 3);
  return consonants.padEnd(3, 'X');
}

/**
 * Génère un SKU candidat pour un produit.
 * Le caller doit vérifier l'unicité avec findUniqueSku().
 */
export function generateSku(name: string, category: string): string {
  const catCode = CATEGORY_CODES[category] ?? 'AUTRE';
  const nameCodePart = nameCode(name);
  return `RM-${catCode}-${nameCodePart}-001`;
}

/**
 * Cherche un SKU unique en incrémentant le suffixe numérique si nécessaire.
 * Returns le SKU final à utiliser.
 */
export async function findUniqueSku(baseSku: string): Promise<string> {
  const existing = await prisma.product.findFirst({ where: { sku: baseSku } });
  if (!existing) return baseSku;

  // Le SKU base existe : trouver le prochain numéro disponible
  // baseSku format : RM-XXX-YYY-NNN
  const match = baseSku.match(/^(.+)-(\d{3})$/);
  if (!match) {
    // Pas le format attendu : ajoute -001
    return `${baseSku}-001`;
  }

  const prefix = match[1];
  // Cherche tous les SKU avec ce préfixe
  const siblings = await prisma.product.findMany({
    where: { sku: { startsWith: `${prefix}-` } },
    select: { sku: true },
  });

  const usedNumbers = new Set<number>();
  for (const s of siblings) {
    const m = s.sku?.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}-(\\d{3})$`));
    if (m) usedNumbers.add(parseInt(m[1], 10));
  }

  // Trouve le plus petit numéro disponible >= 1
  let num = 1;
  while (usedNumbers.has(num) && num < 1000) num++;
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

/**
 * Map d'une catégorie site → ID(s) de catégorie(s) Clover correspondantes.
 *
 * On utilise les catégories qui existent déjà dans Clover (chargées via
 * fetchAllCloverCategories). Si une catégorie n'existe pas, on retourne
 * un tableau vide et le caller décide quoi faire (créer la catégorie ou skip).
 *
 * @param siteCategory - slug de la catégorie site (ex: 'cristaux')
 * @param cloverCategories - liste des catégories Clover (résultat de fetchAllCloverCategories)
 */
export function mapSiteToCloverCategoryIds(
  siteCategory: string,
  cloverCategories: Array<{ id: string; name: string }>,
): string[] {
  const siteCategoryNames: Record<string, string[]> = {
    'cristaux': ['Cristaux', 'Pierres', 'Pierres et Cristaux', 'Crystals'],
    'runes': ['Runes', 'Runes Vikings'],
    'tarot': ['Tarot', 'Tarots'],
    'oracle': ['Oracle', 'Oracles'],
    'herbes-encens': ['Herbes', 'Encens', 'Herbes & Encens', 'Herbes et Encens'],
    'bougies': ['Bougies', 'Candles'],
    'bijoux': ['Bijoux', 'Jewelry'],
    'orgonites': ['Orgonites', 'Orgone'],
    'baguettes-magiques': ['Baguettes', 'Baguettes magiques', 'Wands'],
  };

  const candidates = siteCategoryNames[siteCategory] ?? [];
  const matched: string[] = [];

  for (const cat of cloverCategories) {
    const nameLower = cat.name.toLowerCase();
    for (const candidate of candidates) {
      if (nameLower === candidate.toLowerCase() || nameLower.includes(candidate.toLowerCase())) {
        matched.push(cat.id);
        break;
      }
    }
  }

  return matched;
}
