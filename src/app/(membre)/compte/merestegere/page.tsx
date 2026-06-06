import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

export default function MerestegerePage() {
  return (
    <div>
      <MembreHeader
        emoji="📖"
        title="Le Merestegere"
        subtitle="Notre grimoire des membres — lecture en ligne et téléchargement"
      />
      <ComingSoon message="Les chapitres du Merestegere seront disponibles ici (Phase 3)." />
    </div>
  );
}
