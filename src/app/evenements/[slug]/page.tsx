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

  // Total des inscriptions confirmées — sert au calcul des places restantes.
  // Ce total N'EST PAS filtré par consentement : quelqu'un qui n'a pas accepté
  // d'apparaître dans « Le cercle » occupe quand même une place.
  const totalInscrits = evenement._count.registrations;

  // Liste des personnes présentes dans « Le cercle » : le filtre `showPublicly`
  // est posé DANS la requête Prisma, pas après coup — une inscription sans
  // consentement ne doit jamais quitter le serveur (Loi 25 : la présence à un
  // rituel révèle une croyance/pratique spirituelle, catégorie protégée).
  // Contrairement à avant, cette liste est désormais construite pour tout le
  // monde, connecté ou non — seul son contenu (qui a consenti) reste filtré.
  const participantsPublics = (
    await prisma.eventRegistration.findMany({
      where: { eventId: evenement.id, status: 'CONFIRMED', showPublicly: true },
      select: { id: true, userId: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'asc' },
    })
  ).map((inscription) => ({
    id: inscription.id,
    prenom: inscription.firstName,
    initiale: inscription.lastName.trim().charAt(0).toUpperCase(),
    estMoi: inscription.userId === userId,
  }));

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

        {/* « Le cercle » : visible pour tout le monde (connecté ou non), dans
            tous les états de la page — pas seulement pour la personne déjà
            inscrite. Seuls les prénoms des personnes ayant consenti à y
            apparaître sont montrés ; le compte total d'inscrits reste séparé,
            calculé sans ce filtre (voir `restantes` ci-dessus). */}
        <div className="mb-8 rounded-lg border border-violet-royal/40 bg-charbon-mystere p-6 text-left">
          <p className="text-center font-cinzel text-sm uppercase tracking-widest text-or-ancien">
            Le cercle
          </p>
          {totalInscrits === 0 ? (
            <p className="mt-2 text-center font-cormorant text-parchemin-vieilli/70">
              Soyez la première personne à réserver sa place pour ce rituel.
            </p>
          ) : participantsPublics.length === 0 ? (
            <p className="mt-2 text-center font-cormorant text-parchemin-vieilli/70">
              {totalInscrits} personne{totalInscrits > 1 ? 's' : ''}{' '}
              {totalInscrits > 1 ? 'sont inscrites' : 'est inscrite'}.
            </p>
          ) : participantsPublics.length === 1 && participantsPublics[0].estMoi ? (
            <p className="mt-2 text-center font-cormorant text-parchemin-vieilli/70">
              Vous êtes la première à avoir accepté d&apos;apparaître ici — le cercle se formera
              bientôt.
            </p>
          ) : (
            <ul className="mt-3 space-y-1 font-cormorant text-parchemin-vieilli/80">
              {participantsPublics.map((participant) => (
                <li key={participant.id}>
                  {participant.prenom} {participant.initiale}.
                  {participant.estMoi && <span className="text-turquoise-cristal"> (vous)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!estAnnule && !estPasse && (
          <FormulaireInscription
            slug={slug}
            estConnecte={!!userId}
            placesRestantes={restantes}
            dejaInscrit={dejaInscrit}
            capacite={evenement.capacity}
            nomComplet={nomComplet}
            titreEvenement={evenement.title}
          />
        )}
      </div>
    </main>
  );
}
