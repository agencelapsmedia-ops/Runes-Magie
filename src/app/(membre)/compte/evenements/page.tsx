import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formaterDateEvenement } from '@/lib/evenements';
import { MembreHeader } from '@/components/membre/MembrePage';
import MesInscriptions, { type InscriptionAffichee } from './MesInscriptions';

export const metadata: Metadata = {
  title: 'Mes événements | Runes & Magie',
  robots: { index: false, follow: false },
};

export default async function EvenementsMembrePage() {
  // La garde d'accès (membre connecté) est déjà assurée par le layout
  // src/app/(membre)/compte/layout.tsx.
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? '';

  const inscriptions = userId
    ? await prisma.eventRegistration.findMany({
        where: { userId, status: 'CONFIRMED' },
        include: { event: true },
        orderBy: { event: { startsAt: 'asc' } },
      })
    : [];

  const maintenant = Date.now();

  function versAffichage(inscription: (typeof inscriptions)[number]): InscriptionAffichee {
    return {
      id: inscription.id,
      eventSlug: inscription.event.slug,
      eventTitle: inscription.event.title,
      dateFormatee: formaterDateEvenement(inscription.event.startsAt),
      location: inscription.event.location,
      isOnline: inscription.event.isOnline,
    };
  }

  const aVenir = inscriptions
    .filter((inscription) => inscription.event.startsAt.getTime() >= maintenant)
    .map(versAffichage);

  // Les événements passés sont présentés du plus récent au plus ancien —
  // inversion de l'ordre croissant utilisé pour la requête.
  const passees = inscriptions
    .filter((inscription) => inscription.event.startsAt.getTime() < maintenant)
    .reverse()
    .map(versAffichage);

  return (
    <div>
      <MembreHeader
        emoji="🔥"
        title="Mes événements"
        subtitle="Vos inscriptions aux rituels, veillées et célébrations"
      />
      <MesInscriptions aVenir={aVenir} passees={passees} />
    </div>
  );
}
