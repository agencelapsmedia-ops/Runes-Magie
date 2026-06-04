import { prisma } from '@/lib/db';
import { getOfferingsByCategoryIds, type OfferingView } from '@/lib/offerings';

export interface ServiceCategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  parentId: string | null;
  sortOrder: number;
  showOnHome: boolean;
  isActive: boolean;
  offeringCount: number; // services assignés directement à cette catégorie
  children: ServiceCategoryNode[];
}

/**
 * Arbre des catégories (catégories de 1er niveau → sous-catégories), ordonné,
 * avec le nombre de services assignés directement à chaque nœud. Pour l'admin.
 */
export async function getServiceCategoryTree(): Promise<ServiceCategoryNode[]> {
  const [cats, counts] = await Promise.all([
    prisma.serviceCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.offering.groupBy({ by: ['categoryId'], _count: { _all: true } }),
  ]);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    if (c.categoryId) countMap.set(c.categoryId, c._count._all);
  }

  const nodes: ServiceCategoryNode[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    emoji: c.emoji,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    showOnHome: c.showOnHome,
    isActive: c.isActive,
    offeringCount: countMap.get(c.id) ?? 0,
    children: [],
  }));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: ServiceCategoryNode[] = [];
  for (const n of nodes) {
    const parent = n.parentId ? byId.get(n.parentId) : undefined;
    if (parent) parent.children.push(n);
    else roots.push(n);
  }
  return roots;
}

export interface ServiceCategoryOption {
  id: string;
  name: string;
  depth: number; // 0 = catégorie principale, 1 = sous-catégorie
}

/** Liste à plat (catégorie puis ses sous-catégories) pour un menu déroulant. */
export async function getServiceCategoryOptions(): Promise<ServiceCategoryOption[]> {
  const tree = await getServiceCategoryTree();
  const out: ServiceCategoryOption[] = [];
  for (const root of tree) {
    out.push({ id: root.id, name: root.name, depth: 0 });
    for (const child of root.children) {
      out.push({ id: child.id, name: child.name, depth: 1 });
    }
  }
  return out;
}

export interface HomeSlider {
  id: string;
  title: string;
  emoji: string;
  offerings: OfferingView[];
}

/**
 * Sliders de la page d'accueil : chaque catégorie cochée « afficher sur
 * l'accueil » (showOnHome) et active devient un slider, rempli des services
 * qui lui sont assignés ET de ceux de ses sous-catégories.
 * Une catégorie sans service n'affiche aucun slider (géré par OfferingSlider).
 */
export async function getHomeSliders(): Promise<HomeSlider[]> {
  const cats = await prisma.serviceCategory.findMany({
    where: { showOnHome: true, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { children: { select: { id: true } } },
  });

  const sliders: HomeSlider[] = [];
  for (const cat of cats) {
    const ids = [cat.id, ...cat.children.map((c) => c.id)];
    const offerings = await getOfferingsByCategoryIds(ids);
    sliders.push({ id: cat.id, title: cat.name, emoji: cat.emoji, offerings });
  }
  return sliders;
}
