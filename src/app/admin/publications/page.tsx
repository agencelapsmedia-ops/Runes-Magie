import { prisma } from '@/lib/db';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserPost } from '@/lib/social-posts';
import { serialiserCompte } from '@/lib/social-accounts';
import PublicationsClient from './PublicationsClient';

export const dynamic = 'force-dynamic';

/** Publications réseaux sociaux : calendrier éditorial + liste + fiche. */
export default async function PublicationsPage() {
  const [posts, comptes] = await Promise.all([
    prisma.socialPost.findMany({
      where: { organizationId: ORGANIZATION_ID },
      include: {
        targets: { include: { account: { select: { label: true } } } },
        jobs: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    }),
    prisma.socialAccount.findMany({
      where: { organizationId: ORGANIZATION_ID },
      orderBy: [{ network: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);

  return (
    <PublicationsClient
      postsInitiaux={posts.map(serialiserPost)}
      comptes={comptes.map((c) => JSON.parse(JSON.stringify(serialiserCompte(c))))}
    />
  );
}
