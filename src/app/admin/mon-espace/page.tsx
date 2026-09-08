import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ProfileEditor from '@/app/(holistique)/soins/dashboard/praticien/profil/ProfileEditor';
import AvailabilityEditor from '@/app/(holistique)/soins/dashboard/praticien/disponibilites/AvailabilityEditor';

export const dynamic = 'force-dynamic';

/**
 * « Mon profil & réglages » — refonte Espace Noctura unifié (2026-08-22).
 * Regroupe dans l'admin ce qui vivait au pupitre praticien : profil public
 * et disponibilités. Réutilise ProfileEditor et AvailabilityEditor tels quels.
 * Les liens services / revenus / praticiennes vivent dans « Contenu du site »
 * (/admin/site) depuis 2026-09-08 ; la to-do est passée dans Laps Media.
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

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 font-cinzel text-2xl text-[#2D1B4E]">Mon profil &amp; réglages</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ton profil public et tes disponibilités.
      </p>

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
