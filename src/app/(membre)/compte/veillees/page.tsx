import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

export default function VeilleesPage() {
  return (
    <div>
      <MembreHeader
        emoji="🌙"
        title="Les Veillées de Noctura"
        subtitle="La diffusion de la semaine et ses replays"
      />
      <ComingSoon message="La Veillée de la semaine et les replays arriveront ici (Phase 4)." />
    </div>
  );
}
