import { prisma } from '@/lib/db';
import ChangeCard from './ChangeCard';

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default async function ModificationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? 'PENDING';

  const [pending, approved, rejected] = await Promise.all([
    prisma.pendingPractitionerChange.findMany({
      where: { status: 'PENDING' },
      include: {
        practitioner: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.pendingPractitionerChange.findMany({
      where: { status: 'APPROVED' },
      include: {
        practitioner: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 50,
    }),
    prisma.pendingPractitionerChange.findMany({
      where: { status: 'REJECTED' },
      include: {
        practitioner: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 50,
    }),
  ]);

  const lists = { PENDING: pending, APPROVED: approved, REJECTED: rejected };
  const changes = lists[tab as keyof typeof lists] ?? pending;

  const tabs = [
    { key: 'PENDING', label: `En attente (${pending.length})`, color: '#92400E', bg: '#FEF3C7' },
    { key: 'APPROVED', label: `Approuvées (${approved.length})`, color: '#065F46', bg: '#D1FAE5' },
    { key: 'REJECTED', label: `Rejetées (${rejected.length})`, color: '#991B1B', bg: '#FEE2E2' },
  ];

  // Pré-charger les valeurs actuelles des praticiens pour pouvoir afficher le diff
  const practitionerIds = [...new Set(changes.map((c) => c.practitionerId))];
  const currentPractitioners = practitionerIds.length
    ? await prisma.practitioner.findMany({
        where: { id: { in: practitionerIds } },
        include: {
          user: { select: { firstName: true, lastName: true } },
          availabilities: true,
        },
      })
    : [];
  const currentByPractitionerId = Object.fromEntries(
    currentPractitioners.map((p) => [p.id, p]),
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#2D1B4E',
            marginBottom: '8px',
          }}
        >
          ᚷ Modifications praticiens
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Approuver ou rejeter les demandes de modification de profil et de disponibilités.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #E5E7EB',
        }}
      >
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/praticiens/modifications?tab=${t.key}`}
            style={{
              padding: '10px 20px',
              fontFamily: 'var(--font-cinzel, serif)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderBottom: tab === t.key ? '2px solid #6B3FA0' : '2px solid transparent',
              color: tab === t.key ? '#6B3FA0' : '#6B7280',
              marginBottom: '-2px',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* List */}
      {changes.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            padding: '48px',
            textAlign: 'center',
            color: '#9CA3AF',
          }}
        >
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem' }}>
            Aucune demande dans cette catégorie.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {changes.map((change) => {
            const currentPractitioner = currentByPractitionerId[change.practitionerId];
            return (
              <ChangeCard
                key={change.id}
                change={{
                  id: change.id,
                  type: change.type,
                  payload: change.payload as Record<string, unknown>,
                  status: change.status,
                  requestedAt: change.requestedAt.toISOString(),
                  reviewedAt: change.reviewedAt?.toISOString() ?? null,
                  adminNote: change.adminNote,
                }}
                practitionerName={`${change.practitioner.user.firstName} ${change.practitioner.user.lastName}`.trim()}
                practitionerEmail={change.practitioner.user.email}
                current={
                  currentPractitioner
                    ? {
                        firstName: currentPractitioner.user.firstName,
                        lastName: currentPractitioner.user.lastName,
                        bio: currentPractitioner.bio,
                        specialties: currentPractitioner.specialties,
                        yearsExperience: currentPractitioner.yearsExperience,
                        hourlyRate: currentPractitioner.hourlyRate,
                        photoUrl: currentPractitioner.photoUrl,
                        availabilities: currentPractitioner.availabilities
                          .filter((a) => a.isActive)
                          .map((a) => ({
                            day: DAY_NAMES[a.dayOfWeek],
                            startTime: a.startTime,
                            endTime: a.endTime,
                          })),
                      }
                    : null
                }
                dayNames={DAY_NAMES}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
