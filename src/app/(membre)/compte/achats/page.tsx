import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

export default function AchatsPage() {
  return (
    <div>
      <MembreHeader
        emoji="🛒"
        title="Achats & factures"
        subtitle="Votre historique de commandes et vos factures PDF"
      />
      <ComingSoon message="Votre historique d'achats et vos factures apparaîtront ici (Phase 1)." />
    </div>
  );
}
