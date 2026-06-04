import type { Metadata } from 'next';
import { getServicesByCategory, getCoursesForFormation } from '@/data/services';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ServiceCard from '@/components/services/ServiceCard';

export const metadata: Metadata = {
  title: 'École | Runes & Magie',
  description:
    'Cours uniques et formations de Runes & Magie : initiation aux runes, lecture du Tarot, magie des cristaux et programmes complets.',
};

export default function EcolePage() {
  const items = getServicesByCategory('ecole');

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="École" subtitle="Cours uniques & formations" as="h1" />
        <RuneDivider className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              hrefBase="/ecole"
              courseCount={
                service.type === 'formation' ? getCoursesForFormation(service).length : undefined
              }
            />
          ))}
        </div>
        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
