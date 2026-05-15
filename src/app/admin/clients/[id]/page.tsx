import { prisma } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getClientDetail(id: string) {
  return prisma.holisticUser.findUnique({
    where: { id },
    include: {
      clientBookings: {
        include: {
          practitioner: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          payment: true,
        },
        orderBy: { startsAt: 'desc' },
      },
      reviews: {
        include: {
          practitioner: { select: { slug: true } },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
}

const STATUS_STYLES: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D', label: 'En attente' },
  CONFIRMED: { bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7', label: 'Confirmée' },
  CANCELLED: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5', label: 'Annulée' },
  COMPLETED: { bg: '#DBEAFE', fg: '#1E3A8A', border: '#93C5FD', label: 'Terminée' },
};

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D', label: 'En attente' },
  PAID: { bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7', label: 'Payé' },
  REFUNDED: { bg: '#E0E7FF', fg: '#3730A3', border: '#A5B4FC', label: 'Remboursé' },
  FAILED: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5', label: 'Échoué' },
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientDetail(id);
  if (!client) notFound();

  // Stats calculées
  const totalBookings = client.clientBookings.length;
  const totalSpent = client.clientBookings.reduce(
    (sum, b) => sum + (b.payment?.status === 'PAID' ? b.payment.amountTotal : 0),
    0,
  );
  const upcomingBookings = client.clientBookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.startsAt) > new Date(),
  ).length;

  // Vérifier si la personne est aussi abonnée à l'infolettre (lookup par email)
  const newsletterSub = await prisma.newsletterSubscriber.findUnique({
    where: { email: client.email },
  });

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          href="/admin/clients"
          style={{
            fontSize: '0.8rem',
            color: '#6B7280',
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
          }}
        >
          ← Retour à la liste des clients
        </Link>
      </div>

      {/* Header — Profil client */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#EDE9FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            color: '#6B3FA0',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {(client.firstName[0] ?? '?').toUpperCase()}
          {(client.lastName[0] ?? '').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel, serif)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#2D1B4E',
              marginBottom: '4px',
            }}
          >
            {client.firstName} {client.lastName}
          </h1>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#6B7280' }}>
            <a href={`mailto:${client.email}`} style={{ color: '#6B7280', textDecoration: 'none' }}>
              ✉ {client.email}
            </a>
            {client.phone && (
              <a href={`tel:${client.phone}`} style={{ color: '#6B7280', textDecoration: 'none' }}>
                ☎ {client.phone}
              </a>
            )}
            <span>
              Membre depuis le {new Date(client.createdAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {client.dischargeSignedAt ? (
              <Badge color="green">Décharge signée</Badge>
            ) : (
              <Badge color="yellow">Décharge non signée</Badge>
            )}
            {newsletterSub && !newsletterSub.unsubscribedAt && <Badge color="green">Abonné infolettre</Badge>}
            {newsletterSub?.unsubscribedAt && <Badge color="red">Désabonné infolettre</Badge>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total réservations" value={totalBookings.toString()} icon="ᛜ" />
        <StatCard label="RDV à venir" value={upcomingBookings.toString()} icon="ᛃ" highlight={upcomingBookings > 0} />
        <StatCard
          label="Total dépensé"
          value={`${totalSpent.toFixed(2)} $`}
          icon="ᚴ"
          highlight={totalSpent > 0}
        />
      </div>

      {/* Réservations */}
      <Section title="Historique des réservations" icon="ᛜ">
        {client.clientBookings.length === 0 ? (
          <EmptyState message="Aucune réservation pour ce client" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Date', 'Praticien', 'Durée', 'Statut', 'Paiement', 'Montant'].map((h) => (
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
              {client.clientBookings.map((b, idx) => {
                const durationMin = Math.round(
                  (new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) / 60000,
                );
                const statusStyle = STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING;
                const paymentStyle = b.payment ? PAYMENT_STATUS_STYLES[b.payment.status] ?? PAYMENT_STATUS_STYLES.PENDING : null;
                return (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>
                      {new Date(b.startsAt).toLocaleDateString('fr-CA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <br />
                      <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                        {new Date(b.startsAt).toLocaleTimeString('fr-CA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>
                      {b.practitioner.user.firstName} {b.practitioner.user.lastName}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>
                      {durationMin} min
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: statusStyle.bg,
                          color: statusStyle.fg,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {paymentStyle ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: paymentStyle.bg,
                            color: paymentStyle.fg,
                            border: `1px solid ${paymentStyle.border}`,
                          }}
                        >
                          {paymentStyle.label}
                        </span>
                      ) : (
                        <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563', fontWeight: 600 }}>
                      {b.payment ? `${b.payment.amountTotal.toFixed(2)} $` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* Avis */}
      {client.reviews.length > 0 && (
        <Section title="Avis laissés" icon="ᛞ">
          <div style={{ padding: '16px' }}>
            {client.reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ color: '#C9A84C', fontSize: '0.95rem' }}>
                    {'★'.repeat(r.rating)}
                    <span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                    Pour {r.practitioner.slug} —{' '}
                    {new Date(r.submittedAt).toLocaleDateString('fr-CA')}
                  </span>
                </div>
                {r.comment && (
                  <p style={{ fontSize: '0.85rem', color: '#4B5563', fontStyle: 'italic' }}>
                    « {r.comment} »
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Décharge — détails techniques */}
      {client.dischargeSignedAt && (
        <Section title="Décharge LCCJTI" icon="ᚦ">
          <div style={{ padding: '16px', fontSize: '0.85rem', color: '#4B5563' }}>
            <p>
              <strong>Signée le :</strong>{' '}
              {new Date(client.dischargeSignedAt).toLocaleString('fr-CA')}
            </p>
            {client.dischargeIp && (
              <p>
                <strong>IP :</strong> <code>{client.dischargeIp}</code>
              </p>
            )}
            {client.dischargeHash && (
              <p style={{ wordBreak: 'break-all' }}>
                <strong>Hash :</strong>{' '}
                <code style={{ fontSize: '0.75rem' }}>{client.dischargeHash}</code>
              </p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#2D1B4E',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: '#6B3FA0' }}>{icon}</span>
        {title}
      </h2>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
      {message}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'yellow' | 'red' }) {
  const colors: Record<typeof color, { bg: string; fg: string; border: string }> = {
    green: { bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7' },
    yellow: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D' },
    red: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5' },
  };
  const c = colors[color];
  return (
    <span
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
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2D1B4E', lineHeight: 1 }}>
            {value}
          </p>
        </div>
        <div
          style={{
            fontSize: '1.8rem',
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
