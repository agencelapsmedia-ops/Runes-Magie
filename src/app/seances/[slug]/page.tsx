import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getActiveOfferingViewBySlug } from '@/lib/offerings';
import { buildServiceLandingMetadata } from '@/lib/service-landing';
import ServiceLandingTemplate from '@/components/services/ServiceLandingTemplate';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getActiveOfferingViewBySlug(slug);
  if (!offering) return { title: 'Seance introuvable | Runes & Magie' };
  return buildServiceLandingMetadata(offering);
}

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offering = await getActiveOfferingViewBySlug(slug);
  if (!offering) notFound();

  const session = await auth();
  const role = session?.user && 'role' in session.user ? session.user.role : null;
  // La praticienne propriétaire (isOwner) a les mêmes droits d'édition que l'admin.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session?.user as any)?.isOwner === true;

  return <ServiceLandingTemplate offering={offering} canEdit={role === 'ADMIN' || isOwner} />;
}
