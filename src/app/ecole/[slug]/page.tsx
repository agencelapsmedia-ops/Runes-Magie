import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getServicesByCategory,
  getServiceBySlug,
  getCoursesForFormation,
} from '@/data/services';
import ServiceDetailView from '@/components/services/ServiceDetailView';
import FormationDetailView from '@/components/services/FormationDetailView';

export function generateStaticParams() {
  return getServicesByCategory('ecole').map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: 'Page introuvable | Runes & Magie' };
  return { title: `${service.name} | Runes & Magie`, description: service.description };
}

export default async function EcoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service || service.category !== 'ecole') notFound();

  if (service.type === 'formation') {
    return <FormationDetailView formation={service} courses={getCoursesForFormation(service)} />;
  }
  return <ServiceDetailView service={service} />;
}
