import OfferingCard from './OfferingCard';
import type { OfferingView } from '@/lib/offerings';

/**
 * Grille de services (4 colonnes sur grand écran) — alternative au slider.
 * Réutilise exactement la même carte (OfferingCard) ; affiche tous les
 * services du groupe d'un coup au lieu d'un défilement horizontal.
 */
export default function OfferingGrid({
  title,
  offerings,
}: {
  title?: string;
  offerings: OfferingView[];
}) {
  if (offerings.length === 0) return null;

  return (
    <div className="mb-14">
      {title && (
        <div className="mb-6">
          <h3 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">{title}</h3>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {offerings.map((o) => (
          <OfferingCard key={o.slug} offering={o} />
        ))}
      </div>
    </div>
  );
}
