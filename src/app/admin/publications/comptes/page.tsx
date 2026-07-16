import { prisma } from '@/lib/db';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserCompte } from '@/lib/social-accounts';
import ComptesClient from './ComptesClient';

export const dynamic = 'force-dynamic';

/** Gestion des comptes Facebook/Instagram connectés au module Publications. */
export default async function ComptesPage() {
  const comptes = await prisma.socialAccount.findMany({
    where: { organizationId: ORGANIZATION_ID },
    orderBy: [{ network: 'asc' }, { createdAt: 'asc' }],
  });

  const chiffrementPret = Boolean(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY);

  return (
    <ComptesClient
      comptesInitiaux={comptes.map((c) => JSON.parse(JSON.stringify(serialiserCompte(c))))}
      chiffrementPret={chiffrementPret}
    />
  );
}
