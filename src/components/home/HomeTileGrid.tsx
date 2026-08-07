import HomeTileCard from './HomeTileCard';
import type { TuileVue } from '@/lib/home-tiles';

/**
 * Grille des tuiles de l'accueil : deux colonnes au téléphone, quatre à partir
 * du grand écran — la disposition des deux maquettes.
 */
export default function HomeTileGrid({ tuiles }: { tuiles: TuileVue[] }) {
  if (tuiles.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:gap-5">
      {tuiles.map((tuile) => (
        <HomeTileCard key={tuile.id} tuile={tuile} />
      ))}
    </div>
  );
}
