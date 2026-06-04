import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOfferingViewBySlug, ECOLE_TYPES } from '@/lib/offerings';
import OfferingDetailView from '@/components/services/OfferingDetailView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getOfferingViewBySlug(slug, ECOLE_TYPES);
  if (!offering) return { title: 'Page introuvable | Runes & Magie' };
  return { title: `${offering.name} | Runes & Magie`, description: offering.description };
}

export default async function EcoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offering = await getOfferingViewBySlug(slug, ECOLE_TYPES);
  if (!offering) notFound();
  return <OfferingDetailView offering={offering} />;
}
