import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { getSeancesOfferings, getEcoleOfferings } from '@/lib/offerings';

/**
 * Plan du site dynamique (/sitemap.xml) : pages statiques publiques + toutes les
 * séances et formations actives, lues depuis la base. Permet à Google de découvrir
 * et d'indexer les pages générées dynamiquement.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = [
    '',
    '/seances',
    '/ecole',
    '/boutique',
    '/a-propos',
    '/runes-vikings',
    '/contact',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  let offeringRoutes: MetadataRoute.Sitemap = [];
  try {
    const [seances, ecole] = await Promise.all([getSeancesOfferings(), getEcoleOfferings()]);
    offeringRoutes = [...seances, ...ecole].map((o) => ({
      url: `${SITE_URL}${o.detailHref}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch {
    // En cas d'indisponibilité de la base, on renvoie au moins les routes statiques.
  }

  return [...staticRoutes, ...offeringRoutes];
}
