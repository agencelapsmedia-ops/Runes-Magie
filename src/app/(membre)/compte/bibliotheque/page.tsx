import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

export default function BibliothequePage() {
  return (
    <div>
      <MembreHeader
        emoji="📚"
        title="Bibliothèque"
        subtitle="Ressources, ebooks et méditations réservés aux membres"
      />
      <ComingSoon message="Les ressources de la bibliothèque seront disponibles ici (Phase 5)." />
    </div>
  );
}
