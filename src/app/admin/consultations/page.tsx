import { prisma } from '@/lib/db';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; border: string; label: string }> = {
    PENDING:   { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', label: 'En attente' },
    CONFIRMED: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', label: 'Confirmé' },
    CANCELLED: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Annulé' },
    COMPLETED: { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: 'Complété' },
  };
  const c = config[status] ?? config.PENDING;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      fontFamily: 'var(--font-cinzel, serif)',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

export default async function ConsultationsAdminPage() {
  const appointments = await prisma.holisticAppointment.findMany({
    include: {
      client: true,
      practitioner: { include: { user: true } },
      payment: true,
    },
    orderBy: { startsAt: 'desc' },
  });

  const durationMin = (a: { startsAt: Date; endsAt: Date }) => {
    return Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000);
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛜ Consultations Holistiques
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          {appointments.length} consultation{appointments.length !== 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {appointments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem' }}>Aucune consultation enregistrée</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Date', 'Client', 'Praticien', 'Statut', 'Paiement', 'Durée'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt, idx) => (
                <tr key={appt.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  {/* Date */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                      {new Date(appt.startsAt).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                      {new Date(appt.startsAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  {/* Client */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 500, color: '#1F2937', fontSize: '0.9rem' }}>
                      {appt.client.firstName} {appt.client.lastName}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{appt.client.email}</p>
                  </td>
                  {/* Practitioner */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 500, color: '#1F2937', fontSize: '0.9rem' }}>
                      {appt.practitioner.user.firstName} {appt.practitioner.user.lastName}
                    </p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {appt.practitioner.specialties.slice(0, 2).map((s) => (
                        <span key={s} style={{ padding: '1px 6px', background: '#EDE9FE', color: '#6B3FA0', borderRadius: '9999px', fontSize: '0.65rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={appt.status} />
                  </td>
                  {/* Payment */}
                  <td style={{ padding: '14px 16px' }}>
                    {appt.payment ? (
                      <div>
                        <p style={{ fontWeight: 600, color: '#065F46', fontSize: '0.9rem' }}>
                          {appt.payment.amountTotal.toFixed(2)} $
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                          {appt.payment.status === 'PAID' ? 'Payé' : appt.payment.status === 'REFUNDED' ? 'Remboursé' : appt.payment.status === 'FAILED' ? 'Échoué' : 'En attente'}
                        </p>
                      </div>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  {/* Duration */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                    {durationMin(appt)} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
