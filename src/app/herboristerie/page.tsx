import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveOfferingViewBySlug } from '@/lib/offerings';
import { parseHerboristerie, HERBORISTERIE_DEFAUT } from '@/lib/pages/herboristerie';
import HerboristerieTemplate, {
  type OffreLiee,
  type ProduitLie,
} from '@/components/pages/HerboristerieTemplate';

/**
 * Page « Herboristerie ».
 *
 * Elle présente la branche dans son ensemble ; la formation n'y est qu'une
 * possibilité parmi d'autres, et non le sujet de la page — c'était le défaut
 * de l'ancienne situation, où « Connexion Végétale » tenait lieu de page
 * d'herboristerie.
 *
 * Les offres et les produits viennent de la base : une section disparaît d'elle
 * même si son contenu n'existe plus, plutôt que d'afficher un lien mort.
 */
export const dynamic = 'force-dynamic';

const SLUG = 'herboristerie';

/** Offres rattachées à l'herboristerie. Les slugs sont ceux de la base. */
const SLUG_CONSULTATION = 'consultation-bohemia';
const SLUGS_FORMATIONS = ['connexion-vegetale'];

/** Catégorie boutique correspondante (voir src/data/products.ts). */
const CATEGORIE_BOUTIQUE = 'herbes-encens';

async function chargerPage() {
  try {
    return await prisma.sitePage.findUnique({
      where: { slug: SLUG },
      select: {
        title: true,
        metaTitle: true,
        metaDescription: true,
        content: true,
        isPublished: true,
        updatedAt: true,
      },
    });
  } catch (err) {
    console.error('Chargement de la page herboristerie échoué:', err);
    return null;
  }
}

/** Réduit une offre au strict nécessaire pour l'affichage. */
async function chargerOffre(slug: string): Promise<OffreLiee | null> {
  try {
    const offre = await getActiveOfferingViewBySlug(slug);
    if (!offre) return null;
    return {
      slug: offre.slug,
      name: offre.name,
      description: offre.description,
      priceLabel: offre.priceLabel,
      durationLabel: offre.durationLabel,
      detailHref: offre.detailHref,
      practitionerName: offre.practitionerName,
    };
  } catch {
    return null;
  }
}

async function chargerProduits(): Promise<ProduitLie[]> {
  try {
    const inactives = await prisma.category.findMany({
      where: { isActive: false },
      select: { slug: true },
    });
    if (inactives.some((c) => c.slug === CATEGORIE_BOUTIQUE)) return [];

    return await prisma.product.findMany({
      where: { category: CATEGORIE_BOUTIQUE, inStock: true },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        image: true,
        category: true,
        checkoutType: true,
      },
      orderBy: { name: 'asc' },
      take: 8,
    });
  } catch (err) {
    console.error('Chargement des produits d’herboristerie échoué:', err);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await chargerPage();
  const contenu = parseHerboristerie(page?.content);

  const titre = page?.metaTitle?.trim() || page?.title?.trim() || contenu.heroTitre;
  const description = page?.metaDescription?.trim() || contenu.heroAccroche;

  return {
    title: titre,
    description,
    alternates: { canonical: `/${SLUG}` },
    openGraph: {
      title: titre,
      description,
      url: `/${SLUG}`,
      ...(contenu.heroImage ? { images: [{ url: contenu.heroImage }] } : {}),
    },
  };
}

export default async function HerboristeriePage() {
  const [page, consultation, formations, produits] = await Promise.all([
    chargerPage(),
    chargerOffre(SLUG_CONSULTATION),
    Promise.all(SLUGS_FORMATIONS.map(chargerOffre)),
    chargerProduits(),
  ]);

  const session = await auth();
  const role = session?.user && 'role' in session.user ? session.user.role : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session?.user as any)?.isOwner === true;
  const canEdit = role === 'ADMIN' || isOwner;

  if (page && !page.isPublished && !canEdit) notFound();

  const contenu = page ? parseHerboristerie(page.content) : HERBORISTERIE_DEFAUT;

  return (
    <HerboristerieTemplate
      content={contenu}
      canEdit={canEdit}
      updatedAt={page?.updatedAt.toISOString()}
      consultation={consultation}
      formations={formations.filter((f): f is OffreLiee => f !== null)}
      produits={produits}
    />
  );
}
