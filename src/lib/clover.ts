/**
 * Client API Clover — lecture seule de l'inventaire
 *
 * Docs : https://docs.clover.com/reference
 *
 * Variables d'environnement requises :
 *   - CLOVER_MERCHANT_ID  (ex: "5714DXA774CF1")
 *   - CLOVER_API_TOKEN    (généré dans Dashboard → Setup → API Tokens — au minimum scope: inventory:read)
 *   - CLOVER_REGION       (optionnel, défaut: "us". Mettre "us" même au Canada — Clover Canada utilise le même endpoint)
 *
 * Endpoints utilisés :
 *   GET /v3/merchants/{mId}/items   — liste des items
 *   GET /v3/merchants/{mId}/categories — liste des catégories
 */

type CloverRegion = 'us' | 'eu' | 'la';

const REGION_HOSTS: Record<CloverRegion, string> = {
  us: 'https://api.clover.com',
  eu: 'https://api.eu.clover.com',
  la: 'https://api.la.clover.com',
};

function getConfig() {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const apiToken = process.env.CLOVER_API_TOKEN;
  const region = (process.env.CLOVER_REGION ?? 'us') as CloverRegion;

  if (!merchantId) throw new Error('CLOVER_MERCHANT_ID manquant dans .env');
  if (!apiToken) throw new Error('CLOVER_API_TOKEN manquant dans .env');

  const host = REGION_HOSTS[region] ?? REGION_HOSTS.us;
  return { merchantId, apiToken, host };
}

// ════════════════════════════════════════════════════════════════
// Types Clover (subset des champs qu'on utilise)
// ════════════════════════════════════════════════════════════════

export interface CloverItem {
  id: string;
  name: string;
  alternateName?: string;
  sku?: string;
  code?: string;
  price: number; // En cents (ex: 1999 = 19.99 $)
  priceType?: string;
  defaultTaxRates?: boolean;
  unitName?: string;
  cost?: number;
  isRevenue?: boolean;
  stockCount?: number; // niveau de stock (présent si Item Stocks app activée)
  hidden?: boolean;
  available?: boolean;
  modifiedTime?: number;
  categories?: { elements: Array<{ id: string; name: string }> };
}

export interface CloverCategory {
  id: string;
  name: string;
  sortOrder?: number;
}

interface CloverList<T> {
  elements: T[];
  href?: string;
}

// ════════════════════════════════════════════════════════════════
// Fetcher générique avec gestion de pagination
// ════════════════════════════════════════════════════════════════

async function cloverFetch<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const { apiToken, host } = getConfig();
  const url = new URL(`${host}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Clover API ${res.status} sur ${path} : ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Récupère TOUS les items du marchand (gère la pagination automatiquement).
 * Inclut les catégories en `expand=categories` pour mapping.
 */
export async function fetchAllCloverItems(): Promise<CloverItem[]> {
  const { merchantId } = getConfig();
  const items: CloverItem[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const data = await cloverFetch<CloverList<CloverItem>>(
      `/v3/merchants/${merchantId}/items`,
      { limit: pageSize, offset, expand: 'categories' },
    );
    items.push(...data.elements);
    if (data.elements.length < pageSize) break;
    offset += pageSize;
    if (offset > 10000) {
      // Garde-fou : on n'aspire pas plus de 10k items en une sync
      console.warn('[clover] limite de 10k items atteinte — sync tronquée');
      break;
    }
  }

  return items;
}

/**
 * Récupère toutes les catégories du marchand.
 */
export async function fetchAllCloverCategories(): Promise<CloverCategory[]> {
  const { merchantId } = getConfig();
  const data = await cloverFetch<CloverList<CloverCategory>>(
    `/v3/merchants/${merchantId}/categories`,
    { limit: 1000 },
  );
  return data.elements;
}

// ════════════════════════════════════════════════════════════════
// Helpers de mapping Clover → Product
// ════════════════════════════════════════════════════════════════

/**
 * Génère un slug URL-safe depuis un nom Clover.
 * Ex: "Améthyste 50g" → "amethyste-50g"
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convertit le prix Clover (en cents) en dollars.
 * Ex: 1999 → 19.99
 */
export function cloverPriceToDollars(priceCents: number): number {
  return Math.round(priceCents) / 100;
}

/**
 * Détermine la catégorie site à partir des catégories Clover.
 * Retourne la première catégorie ou "Autre" par défaut.
 */
export function deriveCategory(item: CloverItem): string {
  const first = item.categories?.elements?.[0]?.name;
  return first ?? 'Autre';
}

/**
 * Représente un item Clover normalisé prêt à upserter dans la table Product.
 */
export interface NormalizedCloverProduct {
  cloverId: string;
  sku: string | null;
  name: string;
  slug: string;
  price: number;
  category: string;
  description: string;
  stockQuantity: number | null;
  inStock: boolean;
  hidden: boolean;
}

export function normalizeCloverItem(item: CloverItem): NormalizedCloverProduct {
  const stockQty = item.stockCount;
  const hidden = item.hidden === true || item.available === false;

  return {
    cloverId: item.id,
    sku: item.sku || item.code || null,
    name: item.name,
    slug: nameToSlug(item.alternateName || item.name),
    price: cloverPriceToDollars(item.price),
    category: deriveCategory(item),
    description: item.alternateName || item.name,
    stockQuantity: typeof stockQty === 'number' ? stockQty : null,
    inStock: stockQty == null ? !hidden : stockQty > 0 && !hidden,
    hidden,
  };
}
