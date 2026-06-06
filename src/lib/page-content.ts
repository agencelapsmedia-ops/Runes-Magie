import { prisma } from '@/lib/db';
import { templateDefaults, getTemplate } from '@/lib/page-templates';

/**
 * Helpers pour les pages éditables du site (modèle Prisma SitePage).
 * Voir src/lib/page-templates.ts pour la définition des champs de chaque modèle.
 */

/** Convertit un texte en slug d'URL (minuscules, sans accents, tirets). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fusionne le contenu enregistré avec les valeurs par défaut du modèle. */
export function mergeWithDefaults(template: string, content: unknown): Record<string, string> {
  const defaults = templateDefaults(template);
  const stored = (content && typeof content === 'object' ? content : {}) as Record<string, unknown>;
  const merged: Record<string, string> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const v = stored[key];
    if (typeof v === 'string') merged[key] = v;
  }
  return merged;
}

/**
 * Contenu d'une page par slug, fusionné avec les valeurs par défaut du modèle.
 * Si la page n'existe pas encore en base, on retombe sur les défauts du modèle
 * passé en `fallbackTemplate` — la page publique reste donc toujours fonctionnelle.
 */
export async function getPageContent(
  slug: string,
  fallbackTemplate: string,
): Promise<Record<string, string>> {
  const page = await prisma.sitePage.findUnique({ where: { slug } });
  if (!page) return templateDefaults(fallbackTemplate);
  return mergeWithDefaults(page.template, page.content);
}

/** Page publiée par slug (null si absente ou masquée). */
export async function getPublishedPage(slug: string) {
  const page = await prisma.sitePage.findUnique({ where: { slug } });
  if (!page || !page.isPublished) return null;
  return {
    ...page,
    values: mergeWithDefaults(page.template, page.content),
  };
}

/**
 * Garantit l'existence des pages « système » (ex: l'accueil) afin qu'elles
 * apparaissent toujours dans le back-office, sans casser si elles manquent.
 */
export async function ensureSystemPages() {
  const exists = await prisma.sitePage.findUnique({ where: { slug: 'accueil' } });
  if (!exists) {
    await prisma.sitePage.create({
      data: {
        slug: 'accueil',
        title: 'Page d’accueil',
        template: 'accueil',
        content: {},
        isSystem: true,
        isPublished: true,
        sortOrder: 0,
      },
    });
  }
}

/** Modèle valide ? */
export function isValidTemplate(template: string): boolean {
  return getTemplate(template) !== undefined;
}
