import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

export default function FormationsPage() {
  return (
    <div>
      <MembreHeader
        emoji="🎓"
        title="Mes formations"
        subtitle="Les cours que vous avez achetés et votre progression"
      />
      <ComingSoon message="Vos formations apparaîtront ici dès qu'elles seront branchées (Phase 2)." />
    </div>
  );
}
