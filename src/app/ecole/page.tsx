import type { Metadata } from 'next';
import { getEcoleOfferings } from '@/lib/offerings';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import OfferingCard from '@/components/services/OfferingCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'École de Sorcellerie | Runes & Magie',
  description:
    'Nos cours et ateliers : apprenez les arts énergétiques et divinatoires avec nos praticien·ne·s.',
};

export default async function EcolePage() {
  const items = await getEcoleOfferings();

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="École de Sorcellerie" subtitle="Cours & ateliers" as="h1" />
        <RuneDivider className="my-12" />
        {items.length === 0 ? (
          <p className="text-center font-cormorant italic text-parchemin/50">
            Aucun cours disponible pour l’instant.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((offering) => (
              <OfferingCard key={offering.slug} offering={offering} />
            ))}
          </div>
        )}
        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
