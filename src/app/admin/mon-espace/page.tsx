import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ProfileEditor from '@/app/(holistique)/soins/dashboard/praticien/profil/ProfileEditor';
import AvailabilityEditor from '@/app/(holistique)/soins/dashboard/praticien/disponibilites/AvailabilityEditor';

export const dynamic = 'force-dynamic';

/**
 * « Mon profil & réglages » — refonte Espace Noctura unifié (2026-08-22).
 * Regroupe dans l'admin ce qui vivait au pupitre praticien : profil public,
 * disponibilités, et liens vers les réglages (services, praticiennes, revenus).
 * Réutilise ProfileEditor et AvailabilityEditor tels quels.
 */
export default async function MonEspacePage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user) redirect('/admin/login');
  const isAdmin = user.role === 'ADMIN' || user.isOwner === true;
  if (!isAdmin) redirect('/soins/dashboard/client');

  // La fiche praticienne de la propriétaire (session) — ou la propriétaire
  // de la plateforme si la session est un AdminUser pur.
  const practitionerId: string | null = user.practitionerId
    ?? (await prisma.practitioner.findFirst({ where: { isOwner: true }, select: { id: true } }))?.id
    ?? null;

  const practitioner = practitionerId
    ? await prisma.practitioner.findUnique({
        where: { id: practitionerId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      })
    : null;

  const availabilities = practitionerId
    ? await prisma.holisticAvailability.findMany({
        where: { practitionerId, isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })
    : [];

  const liens = [
    { href: '/admin/offerings', label: 'ᚹ Mes services & soins', desc: 'Prix, durées et descriptions des séances.' },
    { href: '/admin/revenus-holistique', label: 'ᚠ Mes revenus', desc: 'Paiements, commissions et versements.' },
    { href: '/admin/praticiens', label: 'ᛗ Praticiennes', desc: 'Fiches et inscriptions de l’équipe.' },
    { href: '/admin/todo', label: 'ᛏ To-do liste', desc: 'Les tâches du projet.' },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 font-cinzel text-2xl text-[#2D1B4E]">Mon profil &amp; réglages</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ton profil public, tes disponibilités et les réglages de la plateforme — tout au même endroit.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {liens.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-[#4A2D7A] hover:border-[#6B3FA0]">
            {l.label}
            <span className="mt-1 block text-xs font-normal text-gray-500">{l.desc}</span>
          </Link>
        ))}
      </div>

      {practitioner ? (
        <>
          {/* Les éditeurs viennent du pupitre (thème sombre) : on les pose sur un
              fond nuit pour qu'ils restent lisibles dans le shell clair. */}
          <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: 'var(--noir-nuit)' }}>
            <div className="p-6">
              <h2 className="mb-4 font-cinzel text-sm uppercase tracking-widest" style={{ color: 'var(--or-ancien)' }}>
                Mon profil public
              </h2>
              <ProfileEditor
                defaults={{
                  firstName: practitioner.user.firstName,
                  lastName: practitioner.user.lastName,
                  bio: practitioner.bio ?? '',
                  specialties: practitioner.specialties,
                  yearsExperience: practitioner.yearsExperience ?? 0,
                  hourlyRate: practitioner.hourlyRate,
                  photoUrl: practitioner.photoUrl,
                }}
              />
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: 'var(--noir-nuit)' }}>
            <div className="p-6">
              <h2 className="mb-4 font-cinzel text-sm uppercase tracking-widest" style={{ color: 'var(--or-ancien)' }}>
                Mes disponibilités
              </h2>
              <AvailabilityEditor
                initialBlocks={availabilities.map((a) => ({
                  dayOfWeek: a.dayOfWeek,
                  date: a.date ? a.date.toISOString().slice(0, 10) : null,
                  startTime: a.startTime,
                  endTime: a.endTime,
                  isActive: a.isActive,
                }))}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">Aucune fiche praticienne associée à ce compte.</p>
      )}
    </div>
  );
}
