import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

/**
 * L'ancienne page vitrine « Soins énergétiques & holistiques » a été retirée
 * (décision du 21 août 2026) : /soins redirige maintenant directement vers le
 * calendrier de réservation de Noctura (praticienne propriétaire). Tous les
 * liens existants du site (menu Réservation, chat, boutons) continuent de
 * fonctionner et mènent droit à la réservation.
 * L'ancien contenu vitrine reste dans l'historique git si besoin de le rétablir.
 */
export const dynamic = 'force-dynamic';

export default async function SoinsRedirect() {
  const noctura = await prisma.practitioner.findFirst({
    where: { isOwner: true },
    select: { id: true },
  });
  redirect(noctura ? `/soins/reserver/${noctura.id}` : '/soins/praticiens');
}
