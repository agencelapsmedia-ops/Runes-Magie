import type { Metadata } from 'next';
import { getSeancesOfferings } from '@/lib/offerings';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import OfferingCard from '@/components/services/OfferingCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Séances | Runes & Magie',
  description:
    'Nos soins et consultations : séances individuelles avec nos praticien·ne·s certifié·e·s.',
};

export default async function SeancesPage() {
  const seances = await getSeancesOfferings();

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="Séances" subtitle="Soins & consultations" as="h1" />
        <RuneDivider className="my-12" />
        {seances.length === 0 ? (
          <p className="text-center font-cormorant italic text-parchemin/50">
            Aucune séance disponible pour l’instant.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {seances.map((offering) => (
              <OfferingCard key={offering.slug} offering={offering} />
            ))}
          </div>
        )}
        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
