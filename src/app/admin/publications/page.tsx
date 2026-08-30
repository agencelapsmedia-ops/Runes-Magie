import { prisma } from '@/lib/db';
import { listeOrganisations, resoudreOrgId } from '@/lib/organizations';
import { serialiserPost } from '@/lib/social-posts';
import { serialiserCompte } from '@/lib/social-accounts';
import PublicationsClient from './PublicationsClient';

export const dynamic = 'force-dynamic';

/** Publications réseaux sociaux : calendrier éditorial + liste + fiche, par marque (?org=). */
export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const orgId = await resoudreOrgId(org);

  const [organisations, posts, comptes] = await Promise.all([
    listeOrganisations(),
    prisma.socialPost.findMany({
      where: { organizationId: orgId },
      include: {
        targets: { include: { account: { select: { label: true } } } },
        jobs: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    }),
    prisma.socialAccount.findMany({
      where: { organizationId: orgId },
      orderBy: [{ network: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);

  return (
    <PublicationsClient
      postsInitiaux={posts.map(serialiserPost)}
      comptes={comptes.map((c) => JSON.parse(JSON.stringify(serialiserCompte(c))))}
      organisations={organisations.map((o) => ({ id: o.id, name: o.name, isActive: o.isActive }))}
      orgActive={orgId}
    />
  );
}
