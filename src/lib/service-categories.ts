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
  offerings: OfferingView[];
}

/**
 * Sliders de la page d'accueil : pilotés par les objets HomeSlider (gérés dans
 * /admin/site/sliders). Chaque slider a un titre libre + une liste de
 * catégories/sous-catégories ; il affiche les services rattachés à ces
 * catégories ET à leurs sous-catégories. Un slider sans service ne s'affiche
 * pas (géré par OfferingSlider).
 */
export async function getHomeSliders(): Promise<HomeSlider[]> {
  const [sliders, cats] = await Promise.all([
    prisma.homeSlider.findMany({ where: { isVisible: true }, orderBy: [{ sortOrder: 'asc' }] }),
    prisma.serviceCategory.findMany({ select: { id: true, parentId: true } }),
  ]);

  // parent → ids des sous-catégories (pour étendre une sélection à ses enfants)
  const childrenOf = new Map<string, string[]>();
  for (const c of cats) {
    if (c.parentId) {
      const arr = childrenOf.get(c.parentId) ?? [];
      arr.push(c.id);
      childrenOf.set(c.parentId, arr);
    }
  }

  const result: HomeSlider[] = [];
  for (const s of sliders) {
    const ids = new Set<string>();
    for (const id of s.categoryIds) {
      ids.add(id);
      for (const childId of childrenOf.get(id) ?? []) ids.add(childId);
    }
    const offerings = ids.size ? await getOfferingsByCategoryIds([...ids]) : [];
    result.push({ id: s.id, title: s.title, offerings });
  }
  return result;
}

/**
 * Code « type » technique associé à une catégorie (pour tenir Offering.type à
 * jour sans champ libre). Renvoie le typeCode de la catégorie, sinon celui de
 * son parent, sinon '' (service non rattaché à une page publique /seances ou /ecole).
 */
export async function resolveTypeCode(categoryId: string | null): Promise<string> {
  if (!categoryId) return '';
  const cat = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
    select: { typeCode: true, parent: { select: { typeCode: true } } },
  });
  return cat?.typeCode ?? cat?.parent?.typeCode ?? '';
}
