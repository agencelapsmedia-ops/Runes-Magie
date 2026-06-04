import type { Metadata } from 'next';
import { getServicesByCategory } from '@/data/services';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ServiceCard from '@/components/services/ServiceCard';

export const metadata: Metadata = {
  title: 'Séances | Runes & Magie',
  description:
    'Soins énergétiques et tirages divinatoires avec Noctura : Soin Rituel, tirages de Runes Futhark et de cartes.',
};

export default function SeancesPage() {
  const seances = getServicesByCategory('seances');

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="Séances" subtitle="Soins énergétiques & tirages" as="h1" />
        <RuneDivider className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {seances.map((service) => (
            <ServiceCard key={service.id} service={service} hrefBase="/seances" />
          ))}
        </div>
        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
