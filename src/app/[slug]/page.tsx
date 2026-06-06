import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedPage } from '@/lib/page-content';
import StandardPageTemplate from '@/components/site/StandardPageTemplate';

// Rendu « live » : les modifications de l'éditeur de pages apparaissent
// immédiatement, sans redéploiement.
export const dynamic = 'force-dynamic';

// Cette route attrape les URLs de premier niveau non déjà gérées par une route
// statique (/boutique, /ecole, /soins…). Elle ne rend que les pages publiées
// du modèle « standard » ; l'accueil reste servi par « / ».

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page || page.template !== 'standard') return {};
  return {
    title: page.metaTitle || page.values.pageTitle || page.title,
    description: page.metaDescription || page.values.pageSubtitle || undefined,
  };
}

export default async function DynamicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page || page.template !== 'standard') notFound();

  return (
    <StandardPageTemplate
      title={page.values.pageTitle || page.title}
      subtitle={page.values.pageSubtitle}
      body={page.values.body}
    />
  );
}
