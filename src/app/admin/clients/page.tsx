import { prisma } from '@/lib/db';

async function getClients(search?: string) {
  return prisma.holisticUser.findMany({
    where: {
      role: 'CLIENT',
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      locale: true,
      dischargeSignedAt: true,
      createdAt: true,
      _count: {
        select: { clientBookings: true },
      },
    },
  });
}

export default async function ClientsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? '';

  const [clients, totalClients, newThisMonth, clientsWithBooking] = await Promise.all([
    getClients(search),
    prisma.holisticUser.count({ where: { role: 'CLIENT' } }),
    prisma.holisticUser.count({
      where: {
        role: 'CLIENT',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.holisticUser.count({
      where: { role: 'CLIENT', clientBookings: { some: {} } },
    }),
  ]);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛗ Clients
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Liste des clients inscrits sur la plateforme (rôle CLIENT)
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total clients" value={totalClients.toString()} icon="ᚠ" />
        <StatCard label="Nouveaux ce mois" value={newThisMonth.toString()} icon="ᛃ" highlight={newThisMonth > 0} />
        <StatCard label="Avec au moins 1 RDV" value={clientsWithBooking.toString()} icon="ᛜ" />
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Rechercher par nom, courriel ou téléphone..."
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
              background: '#FFFFFF',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#6B3FA0',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'var(--font-cinzel, serif)',
              cursor: 'pointer',
            }}
          >
            Rechercher
          </button>
          {search && (
            <a
              href="/admin/clients"
              style={{
                padding: '10px 16px',
                background: '#F3F4F6',
                color: '#6B7280',
                borderRadius: '8px',
                fontSize: '0.85rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Effacer
            </a>
          )}
        </div>
      </form>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {clients.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', color: '#E9D5FF' }}>ᛗ</div>
            <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', color: '#6B7280', marginBottom: '4px' }}>
              {search ? 'Aucun client trouvé pour cette recherche' : 'Aucun client inscrit pour le moment'}
            </p>
            {!search && (
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                Les inscriptions via <code>/soins/auth/register</code> apparaîtront ici.
              </p>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Client', 'Courriel', 'Téléphone', 'Décharge', 'Réservations', 'Inscrit le'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-cinzel, serif)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#6B3FA0',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid #F3F4F6',
                    background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  }}
                >
                  {/* Name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#EDE9FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          color: '#6B3FA0',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {(c.firstName[0] ?? '?').toUpperCase()}
                        {(c.lastName[0] ?? '').toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                          {c.firstName} {c.lastName}
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                          {c.locale.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                    <a
                      href={`mailto:${c.email}`}
                      style={{ color: '#4B5563', textDecoration: 'none' }}
                    >
                      {c.email}
                    </a>
                  </td>
                  {/* Phone */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} style={{ color: '#4B5563', textDecoration: 'none' }}>
                        {c.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#D1D5DB' }}>—</span>
                    )}
                  </td>
                  {/* Discharge */}
                  <td style={{ padding: '14px 16px' }}>
                    {c.dischargeSignedAt ? (
                      <span
                        title={`Signée le ${new Date(c.dischargeSignedAt).toLocaleDateString('fr-CA')}`}
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: '#D1FAE5',
                          color: '#065F46',
                          border: '1px solid #6EE7B7',
                        }}
                      >
                        Signée
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FCD34D',
                        }}
                      >
                        Non
                      </span>
                    )}
                  </td>
                  {/* Bookings */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem', fontWeight: 600 }}>
                    {c._count.clientBookings}
                  </td>
                  {/* Created */}
                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                    {new Date(c.createdAt).toLocaleDateString('fr-CA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      {clients.length > 0 && (
        <p style={{ marginTop: '16px', fontSize: '0.8rem', color: '#9CA3AF', textAlign: 'right' }}>
          {clients.length} client{clients.length > 1 ? 's' : ''} affiché{clients.length > 1 ? 's' : ''}
          {search && ` pour "${search}"`}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: highlight ? '1px solid #C9A84C' : '1px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-cinzel, serif)',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            {label}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#2D1B4E', lineHeight: 1 }}>{value}</p>
        </div>
        <div
          style={{
            fontSize: '2rem',
            color: highlight ? '#C9A84C' : '#E9D5FF',
            opacity: 0.6,
            userSelect: 'none',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
