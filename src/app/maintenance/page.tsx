/**
 * Page blanche (mode maintenance, 2026-08-28 à la demande de Jonathan).
 * Tout le site public affiche cette page vide tant que MAINTENANCE = true
 * dans src/proxy.ts. L'administration et la connexion restent accessibles.
 * (L'ancienne page « Temporairement hors service » est dans l'historique git.)
 */
export const dynamic = 'force-static';

export default function MaintenancePage() {
  return <div style={{ minHeight: '100vh', background: '#FFFFFF' }} />;
}
