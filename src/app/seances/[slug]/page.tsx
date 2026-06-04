import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServicesByCategory, getServiceBySlug } from '@/data/services';
import ServiceDetailView from '@/components/services/ServiceDetailView';

export function generateStaticParams() {
  return getServicesByCategory('seances').map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: 'Séance introuvable | Runes & Magie' };
  return { title: `${service.name} | Runes & Magie`, description: service.description };
}

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service || service.category !== 'seances') notFound();
  return <ServiceDetailView service={service} />;
}
