import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formaterDateEvenement } from '@/lib/evenements';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import FormulaireInscription from './FormulaireInscription';

export const dynamic = 'force-dynamic';

// Mémorisée pour la durée de la requête : generateMetadata() et la page
// interrogent toutes deux la même fiche, autant ne lire la base qu'une fois.
const getEvenement = cache((slug: string) =>
  prisma.event.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const evenement = await getEvenement(slug);

  if (!evenement || !evenement.isPublished) {
    return { title: 'Événement introuvable | Runes & Magie' };
  }

  const description = evenement.excerpt ?? evenement.description.slice(0, 160);

  return {
    title: `${evenement.title} | Runes & Magie`,
    description,
    openGraph: {
      title: evenement.title,
      description,
      images: evenement.imageUrl ? [evenement.imageUrl] : undefined,
    },
  };
}

export default async function PageEvenement({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const evenement = await getEvenement(slug);

  // Un événement introuvable ou non publié (brouillon admin) n'existe pas
  // pour le public — jamais de fuite d'un événement pas encore annoncé.
  if (!evenement || !evenement.isPublished) notFound();

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  // Prénom/nom du membre connecté, pour afficher clairement à qui l'inscription
  // profite. L'identifiant de session peut appartenir à un AdminUser plutôt
  // qu'à un HolisticUser (compte d'administration) : dans ce cas la requête ne
  // renvoie rien, et on ne montre simplement pas la phrase personnalisée.
  const membre = userId
    ? await prisma.holisticUser.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      })
    : null;
  const nomComplet = membre ? `${membre.firstName} ${membre.lastName}`.trim() : null;

  // Inscription CONFIRMED de la personne connectée à CET événement précis.
  const monInscription = userId
    ? await prisma.eventRegistration.findFirst({
        where: { eventId: evenement.id, userId, status: 'CONFIRMED' },
        select: { id: true },
      })
    : null;
  const dejaInscrit = monInscription !== null;

  // Liste des personnes présentes ("Le cercle") : donnée confidentielle
  // (Loi 25) — on ne l'interroge même pas si la personne n'est pas elle-même
  // inscrite et confirmée à cet événement, pour être certain qu'elle ne soit
  // jamais transmise au navigateur d'un visiteur ou d'un membre non inscrit.
  const participants = dejaInscrit
    ? (
        await prisma.eventRegistration.findMany({
          where: { eventId: evenement.id, status: 'CONFIRMED' },
          select: { id: true, userId: true, firstName: true, lastName: true },
          orderBy: { createdAt: 'asc' },
        })
      ).map((inscription) => ({
        id: inscription.id,
        prenom: inscription.firstName,
        initiale: inscription.lastName.trim().charAt(0).toUpperCase(),
        estMoi: inscription.userId === userId,
      }))
    : [];

  const restantes = Math.max(0, evenement.capacity - evenement._count.registrations);
  const estAnnule = evenement.cancelledAt !== null;
  const estPasse = evenement.startsAt.getTime() < Date.now();

  return (
    <main className="min-h-screen bg-noir-nuit py-20">
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle
          title={evenement.title}
          subtitle={formaterDateEvenement(evenement.startsAt)}
          as="h1"
        />
        <RuneDivider />

        {evenement.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={evenement.imageUrl}
            alt={evenement.title}
            className="mb-8 w-full rounded-lg border border-violet-royal/40 object-cover"
          />
        )}

        {/* Un événement passé ou annulé reste affiché — un lien partagé sur les
            réseaux sociaux ne doit jamais renvoyer une page cassée — mais sans
            formulaire d'inscription. */}
        {estAnnule && (
          <div className="mb-8 rounded-lg border border-magenta-rituel/50 bg-charbon-mystere p-6 text-center">
            <p className="font-cinzel text-sm uppercase tracking-widest text-magenta-rituel">
              Événement annulé
            </p>
            <p className="mt-2 font-cormorant text-parchemin-vieilli/70">
              Cet événement a été annulé. Les personnes déjà inscrites ont été prévenues par
              courriel.
            </p>
          </div>
        )}

        {!estAnnule && estPasse && (
          <div className="mb-8 rounded-lg border border-violet-royal/40 bg-charbon-mystere p-6 text-center">
            <p className="font-cinzel text-sm uppercase tracking-widest text-or-ancien">
              Cet événement a eu lieu
            </p>
            <p className="mt-2 font-cormorant text-parchemin-vieilli/70">
              Les inscriptions sont closes. Consultez nos prochains événements.
            </p>
          </div>
        )}

        <div className="space-y-4 font-cormorant text-lg leading-relaxed text-parchemin-vieilli/80">
          <p className="text-parchemin-vieilli">
            {evenement.location}
            {evenement.isOnline ? ' (en ligne)' : ''}
          </p>
          {evenement.description.split('\n').map((paragraphe, index) => (
            <p key={index}>{paragraphe}</p>
          ))}
          {evenement.bringItems && (
            <p className="text-turquoise-cristal">À apporter : {evenement.bringItems}</p>
          )}
        </div>

        <RuneDivider />

        {!estAnnule && !estPasse && (
          <FormulaireInscription
            slug={slug}
            estConnecte={!!userId}
            placesRestantes={restantes}
            dejaInscrit={dejaInscrit}
            capacite={evenement.capacity}
            nomComplet={nomComplet}
            titreEvenement={evenement.title}
            participants={participants}
          />
        )}
      </div>
    </main>
  );
}
