import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import type { Service } from '@/data/services';

interface ServiceCardProps {
  service: Service;
  hrefBase: string; // ex. '/seances' ou '/ecole'
  courseCount?: number; // pour les formations
}

export default function ServiceCard({ service, hrefBase, courseCount }: ServiceCardProps) {
  const isFormation = service.type === 'formation';

  return (
    <article className="group bg-charbon-mystere border border-violet-royal/40 rounded-lg p-8 transition-all duration-500 hover:border-violet-mystique/70 hover:shadow-[0_0_30px_rgba(107,63,160,0.15)]">
      <div className="flex items-start justify-between mb-6">
        <div className="text-5xl text-or-ancien opacity-80 group-hover:opacity-100 transition-opacity duration-300 select-none">
          {service.icon}
        </div>
        {isFormation && (
          <span className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 text-turquoise-cristal whitespace-nowrap">
            Formation{typeof courseCount === 'number' ? ` · ${courseCount} cours` : ''}
          </span>
        )}
      </div>

      <h2 className="font-cinzel text-2xl text-parchemin mb-3 group-hover:text-or-ancien transition-colors duration-300">
        {service.name}
      </h2>

      <p className="text-parchemin-vieilli/80 leading-relaxed mb-6 font-cormorant text-lg">
        {service.description}
      </p>

      <div className="flex items-center gap-4 mb-6">
        <span className="font-cinzel text-xl text-or-ancien font-semibold">
          {typeof service.price === 'number' ? formatPrice(service.price) : service.price}
        </span>
        <span className="text-parchemin-vieilli/50">|</span>
        <span className="text-parchemin-vieilli/70 text-sm">{service.duration}</span>
      </div>

      <Button href={`${hrefBase}/${service.slug}`} variant="primary" size="md">
        Découvrir
      </Button>
    </article>
  );
}
