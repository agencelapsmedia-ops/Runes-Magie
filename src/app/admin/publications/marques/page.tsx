import { listeOrganisations } from '@/lib/organizations';
import MarquesClient from './MarquesClient';

export const dynamic = 'force-dynamic';

/** Gestion des marques : nom, charte graphique, voix, hashtags. */
export default async function MarquesPage() {
  const organisations = await listeOrganisations();
  return <MarquesClient organisationsInitiales={organisations} />;
}
