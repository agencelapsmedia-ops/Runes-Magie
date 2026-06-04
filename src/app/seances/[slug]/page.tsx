import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOfferingViewBySlug, SEANCES_TYPES } from '@/lib/offerings';
import OfferingDetailView from '@/components/services/OfferingDetailView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getOfferingViewBySlug(slug, SEANCES_TYPES);
  if (!offering) return { title: 'Séance introuvable | Runes & Magie' };
  return { title: `${offering.name} | Runes & Magie`, description: offering.description };
}

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offering = await getOfferingViewBySlug(slug, SEANCES_TYPES);
  if (!offering) notFound();
  return <OfferingDetailView offering={offering} />;
}
