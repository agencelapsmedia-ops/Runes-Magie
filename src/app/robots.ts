import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * Règles d'exploration (/robots.txt) : on autorise l'indexation publique mais on
 * exclut l'admin, les espaces connectés et les API. Déclare aussi le sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/compte', '/soins/dashboard', '/soins/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
