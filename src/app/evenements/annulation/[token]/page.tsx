import type { Metadata } from 'next';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import BoutonAnnulation from './BoutonAnnulation';

export const metadata: Metadata = {
  title: 'Annuler mon inscription | Runes & Magie',
};

export default async function PageAnnulationEvenement({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-noir-nuit py-20">
      <div className="mx-auto max-w-xl px-4">
        <SectionTitle title="Annuler mon inscription" subtitle="Libérer votre place" />
        <RuneDivider />

        {/* L'appel à l'API n'a lieu qu'au clic du bouton ci-dessous, jamais au
            chargement de la page : un aperçu de lien généré automatiquement
            par un client de messagerie ne doit jamais annuler une inscription. */}
        <BoutonAnnulation token={token} />
      </div>
    </main>
  );
}
