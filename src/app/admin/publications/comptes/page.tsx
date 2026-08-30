import { prisma } from '@/lib/db';
import { listeOrganisations, resoudreOrgId } from '@/lib/organizations';
import { serialiserCompte } from '@/lib/social-accounts';
import ComptesClient from './ComptesClient';

export const dynamic = 'force-dynamic';

/** Gestion des comptes sociaux connectés, par marque (?org=). */
export default async function ComptesPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const orgId = await resoudreOrgId(org);

  const [organisations, comptes] = await Promise.all([
    listeOrganisations(),
    prisma.socialAccount.findMany({
      where: { organizationId: orgId },
      orderBy: [{ network: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);

  const chiffrementPret = Boolean(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY);

  return (
    <ComptesClient
      comptesInitiaux={comptes.map((c) => JSON.parse(JSON.stringify(serialiserCompte(c))))}
      organisations={organisations.map((o) => ({ id: o.id, name: o.name, isActive: o.isActive }))}
      orgActive={orgId}
      chiffrementPret={chiffrementPret}
    />
  );
}
