import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parseCeremonies, CEREMONIES_DEFAUT } from '@/lib/pages/ceremonies';
import CeremoniesTemplate from '@/components/pages/CeremoniesTemplate';

/**
 * Page « Cérémonies & Animations privées ».
 *
 * Rendue dynamiquement parce que le droit d'édition dépend de la session : la
 * même URL affiche la page nue au public et la page équipée de ses boutons
 * d'édition à l'admin.
 */
export const dynamic = 'force-dynamic';

const SLUG = 'ceremonies';

/**
 * Charge la ligne SitePage. Si elle manque (seed pas encore passé) ou si la
 * base est injoignable, la page s'affiche quand même avec ses textes par
 * défaut — un visiteur ne doit jamais tomber sur une erreur pour ça.
 */
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
    console.error('Chargement de la page cérémonies échoué:', err);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await chargerPage();
  const contenu = parseCeremonies(page?.content);

  // Le gabarit du layout ajoute déjà « | Runes & Magie » : ne pas le répéter.
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

export default async function CeremoniesPage() {
  const page = await chargerPage();

  const session = await auth();
  const role = session?.user && 'role' in session.user ? session.user.role : null;
  // La praticienne propriétaire (isOwner) a les mêmes droits que l'admin.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session?.user as any)?.isOwner === true;
  const canEdit = role === 'ADMIN' || isOwner;

  // Une page dépubliée reste visible pour l'admin, qui doit pouvoir la préparer.
  if (page && !page.isPublished && !canEdit) notFound();

  const contenu = page ? parseCeremonies(page.content) : CEREMONIES_DEFAUT;

  return (
    <CeremoniesTemplate
      content={contenu}
      canEdit={canEdit}
      updatedAt={page?.updatedAt.toISOString()}
    />
  );
}
