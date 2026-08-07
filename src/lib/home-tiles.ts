import { prisma } from '@/lib/db';

/**
 * Tuiles de la grille « application » de l'accueil.
 *
 * Le contenu vit en base pour qu'Annabelle puisse changer un titre, une image
 * ou un lien depuis /admin/site/tuiles, sans redéploiement.
 */

export interface PastilleVue {
  label: string;
  href: string;
  iconKey: string;
}

export interface TuileVue {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  iconKey: string;
  imageUrl: string;
  imageAlt: string;
  imageFocus: string;
  href: string;
  chips: PastilleVue[];
}

export const ANCRAGES = ['center', 'left', 'right', 'top', 'bottom'] as const;
export type Ancrage = (typeof ANCRAGES)[number];

/** Traduit `imageFocus` en classe Tailwind d'object-position. */
export function classeAncrage(focus: string): string {
  switch (focus) {
    case 'left':
      return 'object-left';
    case 'right':
      return 'object-right';
    case 'top':
      return 'object-top';
    case 'bottom':
      return 'object-bottom';
    default:
      return 'object-center';
  }
}

/**
 * Les pastilles sont du JSON libre en base : on ne suppose rien de leur forme.
 * Une donnée abîmée doit faire disparaître les pastilles, pas la page.
 */
export function parsePastilles(json: unknown): PastilleVue[] {
  if (!Array.isArray(json)) return [];
  const sortie: PastilleVue[] = [];
  for (const entree of json) {
    if (!entree || typeof entree !== 'object' || Array.isArray(entree)) continue;
    const brut = entree as Record<string, unknown>;
    const label = typeof brut.label === 'string' ? brut.label.trim() : '';
    if (!label) continue;
    sortie.push({
      label,
      href: typeof brut.href === 'string' ? brut.href.trim() : '',
      iconKey: typeof brut.iconKey === 'string' && brut.iconKey.trim() ? brut.iconKey.trim() : 'etoile',
    });
    if (sortie.length >= 12) break;
  }
  return sortie;
}

/**
 * Charge les tuiles visibles, séparées en cartes et bande.
 * Si la base est injoignable ou la table vide, on renvoie des listes vides :
 * l'accueil affiche alors ses autres sections plutôt qu'une erreur.
 */
export async function getHomeTiles(): Promise<{ cartes: TuileVue[]; bande: TuileVue | null }> {
  try {
    const lignes = await prisma.homeTile.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });

    const vues: Array<TuileVue & { variant: string }> = lignes.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      subtitle: t.subtitle,
      iconKey: t.iconKey,
      imageUrl: t.imageUrl,
      imageAlt: t.imageAlt || t.title,
      imageFocus: t.imageFocus,
      href: t.href,
      chips: parsePastilles(t.chips),
      variant: t.variant,
    }));

    return {
      cartes: vues.filter((t) => t.variant !== 'BANDE'),
      bande: vues.find((t) => t.variant === 'BANDE') ?? null,
    };
  } catch (err) {
    console.error('Chargement des tuiles de l’accueil échoué:', err);
    return { cartes: [], bande: null };
  }
}
