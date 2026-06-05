import type { Metadata } from 'next';
import { getSeancesCatalog } from '@/lib/service-categories';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import OfferingCard from '@/components/services/OfferingCard';
import OfferingSlider from '@/components/services/OfferingSlider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Séances | Runes & Magie',
  description:
    'Nos soins et consultations : séances individuelles avec nos praticien·ne·s certifié·e·s.',
};

export default async function SeancesPage() {
  // Catalogue généré depuis le module Catégories (admin = source unique) :
  // catégorie « Séances » + ses sous-catégories actives, dans l'ordre admin.
  const catalog = await getSeancesCatalog();
  const sections = catalog?.sections ?? [];

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="Séances" subtitle="Soins & consultations" as="h1" />
        <RuneDivider className="my-12" />

        {sections.length === 0 ? (
          <p className="text-center font-cormorant italic text-parchemin/50">
            Aucune séance disponible pour l’instant.
          </p>
        ) : (
          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.id}>
                {/* En-tête de (sous-)catégorie — style commun grille/slider */}
                <div className="mb-6">
                  <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">
                    {section.emoji ? `${section.emoji} ` : ''}
                    {section.name}
                  </h2>
                  {section.description && (
                    <p className="font-cormorant italic text-parchemin/50 mt-1">
                      {section.description}
                    </p>
                  )}
                </div>

                {section.displayMode === 'SLIDER' ? (
                  <OfferingSlider offerings={section.offerings} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {section.offerings.map((offering) => (
                      <OfferingCard key={offering.slug} offering={offering} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
