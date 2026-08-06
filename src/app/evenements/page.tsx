import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formaterDateEvenement } from '@/lib/evenements';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Événements | Runes & Magie',
  description:
    'Rituels, veillées et célébrations à Saint-Eustache. Réservez votre place aux prochains rassemblements de Runes & Magie.',
};

export default async function PageEvenements() {
  const evenements = await prisma.event.findMany({
    where: { isPublished: true, cancelledAt: null, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });

  return (
    <main className="min-h-screen bg-noir-nuit py-20">
      <div className="mx-auto max-w-5xl px-4">
        <SectionTitle title="Événements" subtitle="Rituels, veillées et célébrations" as="h1" />
        <RuneDivider />

        {evenements.length === 0 ? (
          <p className="mt-12 text-center font-cormorant text-lg text-parchemin-vieilli/70">
            Aucun événement à l’horizon pour le moment. Revenez bientôt — la roue tourne.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {evenements.map((evenement) => {
              const restantes = evenement.capacity - evenement._count.registrations;
              return (
                <Link
                  key={evenement.id}
                  href={`/evenements/${evenement.slug}`}
                  className="block overflow-hidden rounded-lg border border-violet-royal/40 bg-charbon-mystere transition hover:border-or-ancien/60"
                >
                  {evenement.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={evenement.imageUrl} alt="" className="h-56 w-full object-cover" />
                  )}
                  <div className="p-6">
                    <h2 className="font-cinzel text-xl text-or-ancien">{evenement.title}</h2>
                    <p className="mt-2 font-cormorant text-parchemin-vieilli/80">
                      {formaterDateEvenement(evenement.startsAt)}
                    </p>
                    <p className="font-cormorant text-parchemin-vieilli/60">{evenement.location}</p>
                    <p className="mt-4 font-cinzel text-sm tracking-widest text-turquoise-cristal">
                      {restantes > 0 ? `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}` : 'COMPLET'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
