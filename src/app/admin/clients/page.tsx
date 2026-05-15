import { prisma } from '@/lib/db';

type Tab = 'comptes' | 'infolettre';

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
      _count: { select: { clientBookings: true } },
    },
  });
}

async function getSubscribers(search?: string) {
  return prisma.newsletterSubscriber.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ClientsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tab: Tab = params.tab === 'infolettre' ? 'infolettre' : 'comptes';
  const search = params.q ?? '';

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    clients,
    subscribers,
    totalClients,
    totalSubscribers,
    newClientsThisMonth,
    newSubscribersThisMonth,
    clientsWithBooking,
    activeSubscribers,
  ] = await Promise.all([
    getClients(search),
    getSubscribers(search),
    prisma.holisticUser.count({ where: { role: 'CLIENT' } }),
    prisma.newsletterSubscriber.count(),
    prisma.holisticUser.count({
      where: { role: 'CLIENT', createdAt: { gte: startOfMonth } },
    }),
    prisma.newsletterSubscriber.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.holisticUser.count({
      where: { role: 'CLIENT', clientBookings: { some: {} } },
    }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'comptes', label: 'Comptes', count: totalClients },
    { key: 'infolettre', label: 'Infolettre', count: totalSubscribers },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛗ Clients
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Comptes clients inscrits et abonnés à l&apos;infolettre
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {tab === 'comptes' ? (
          <>
            <StatCard label="Total clients" value={totalClients.toString()} icon="ᚠ" />
            <StatCard label="Nouveaux ce mois" value={newClientsThisMonth.toString()} icon="ᛃ" highlight={newClientsThisMonth > 0} />
            <StatCard label="Avec au moins 1 RDV" value={clientsWithBooking.toString()} icon="ᛜ" />
          </>
        ) : (
          <>
            <StatCard label="Total abonnés" value={totalSubscribers.toString()} icon="ᚠ" />
            <StatCard label="Nouveaux ce mois" value={newSubscribersThisMonth.toString()} icon="ᛃ" highlight={newSubscribersThisMonth > 0} />
            <StatCard label="Abonnés actifs" value={activeSubscribers.toString()} icon="ᛜ" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/clients?tab=${t.key}`}
            style={{
              padding: '10px 20px',
              fontFamily: 'var(--font-cinzel, serif)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderBottom: tab === t.key ? '2px solid #6B3FA0' : '2px solid transparent',
              color: tab === t.key ? '#6B3FA0' : '#6B7280',
              marginBottom: '-2px',
              transition: 'color 0.2s',
            }}
          >
            {t.label} ({t.count})
          </a>
        ))}
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: '20px' }}>
        <input type="hidden" name="tab" value={tab} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder={tab === 'comptes' ? 'Rechercher par nom, courriel ou téléphone…' : 'Rechercher un abonné…'}
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
              href={`/admin/clients?tab=${tab}`}
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
        {tab === 'comptes' ? (
          <ClientsTable clients={clients} search={search} />
        ) : (
          <SubscribersTable subscribers={subscribers} search={search} />
        )}
      </div>

      {/* Footer info */}
      {tab === 'comptes' && clients.length > 0 && (
        <p style={{ marginTop: '16px', fontSize: '0.8rem', color: '#9CA3AF', textAlign: 'right' }}>
          {clients.length} compte{clients.length > 1 ? 's' : ''} affiché{clients.length > 1 ? 's' : ''}
          {search && ` pour "${search}"`}
        </p>
      )}
      {tab === 'infolettre' && subscribers.length > 0 && (
        <p style={{ marginTop: '16px', fontSize: '0.8rem', color: '#9CA3AF', textAlign: 'right' }}>
          {subscribers.length} abonné{subscribers.length > 1 ? 's' : ''} affiché{subscribers.length > 1 ? 's' : ''}
          {search && ` pour "${search}"`}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Sous-composants
// ────────────────────────────────────────────────────────────────

function ClientsTable({
  clients,
  search,
}: {
  clients: Awaited<ReturnType<typeof getClients>>;
  search: string;
}) {
  if (clients.length === 0) {
    return (
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
    );
  }

  return (
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
            <td style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar firstName={c.firstName} lastName={c.lastName} />
                <div>
                  <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                    {c.firstName} {c.lastName}
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{c.locale.toUpperCase()}</p>
                </div>
              </div>
            </td>
            <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
              <a href={`mailto:${c.email}`} style={{ color: '#4B5563', textDecoration: 'none' }}>
                {c.email}
              </a>
            </td>
            <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
              {c.phone ? (
                <a href={`tel:${c.phone}`} style={{ color: '#4B5563', textDecoration: 'none' }}>
                  {c.phone}
                </a>
              ) : (
                <span style={{ color: '#D1D5DB' }}>—</span>
              )}
            </td>
            <td style={{ padding: '14px 16px' }}>
              {c.dischargeSignedAt ? (
                <Badge color="green" title={`Signée le ${new Date(c.dischargeSignedAt).toLocaleDateString('fr-CA')}`}>
                  Signée
                </Badge>
              ) : (
                <Badge color="yellow">Non</Badge>
              )}
            </td>
            <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem', fontWeight: 600 }}>
              {c._count.clientBookings}
            </td>
            <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
              {new Date(c.createdAt).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SubscribersTable({
  subscribers,
  search,
}: {
  subscribers: Awaited<ReturnType<typeof getSubscribers>>;
  search: string;
}) {
  if (subscribers.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center', color: '#9CA3AF' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px', color: '#E9D5FF' }}>&#10022;</div>
        <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', color: '#6B7280', marginBottom: '4px' }}>
          {search ? 'Aucun abonné trouvé pour cette recherche' : 'Aucun abonné à l\'infolettre pour le moment'}
        </p>
        {!search && (
          <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
            Les inscriptions via <code>/infolettre</code> apparaîtront ici.
          </p>
        )}
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          {['Abonné', 'Courriel', 'Téléphone', 'Statut', 'Source', 'Inscrit le'].map((h) => (
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
        {subscribers.map((s, idx) => {
          const displayName = [s.firstName, s.lastName].filter(Boolean).join(' ') || '—';
          return (
            <tr
              key={s.id}
              style={{
                borderBottom: '1px solid #F3F4F6',
                background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
              }}
            >
              <td style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar firstName={s.firstName ?? '?'} lastName={s.lastName ?? ''} />
                  <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>{displayName}</p>
                </div>
              </td>
              <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                <a href={`mailto:${s.email}`} style={{ color: '#4B5563', textDecoration: 'none' }}>
                  {s.email}
                </a>
              </td>
              <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                {s.phone ? (
                  <a href={`tel:${s.phone}`} style={{ color: '#4B5563', textDecoration: 'none' }}>
                    {s.phone}
                  </a>
                ) : (
                  <span style={{ color: '#D1D5DB' }}>—</span>
                )}
              </td>
              <td style={{ padding: '14px 16px' }}>
                {s.unsubscribedAt ? (
                  <Badge color="red" title={`Désabonné le ${new Date(s.unsubscribedAt).toLocaleDateString('fr-CA')}`}>
                    Désabonné
                  </Badge>
                ) : (
                  <Badge color="green">Actif</Badge>
                )}
              </td>
              <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                {s.source}
              </td>
              <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                {new Date(s.createdAt).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
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
      {(firstName[0] ?? '?').toUpperCase()}
      {(lastName[0] ?? '').toUpperCase()}
    </div>
  );
}

function Badge({
  children,
  color,
  title,
}: {
  children: React.ReactNode;
  color: 'green' | 'yellow' | 'red';
  title?: string;
}) {
  const colors: Record<typeof color, { bg: string; fg: string; border: string }> = {
    green: { bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7' },
    yellow: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D' },
    red: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5' },
  };
  const c = colors[color];
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      {children}
    </span>
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
