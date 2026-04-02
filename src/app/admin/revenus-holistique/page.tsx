import { prisma } from '@/lib/db';

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; border: string; label: string }> = {
    PENDING:   { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', label: 'En attente' },
    PAID:      { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', label: 'Payé' },
    REFUNDED:  { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', label: 'Remboursé' },
    FAILED:    { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Échoué' },
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

export default async function RevenusHolistiquePage() {
  const payments = await prisma.holisticPayment.findMany({
    include: {
      appointment: {
        include: {
          client: true,
          practitioner: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Stats
  const totalEncaisse = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amountTotal, 0);
  const totalCommission = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amountCommission, 0);
  const totalPraticiens = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amountPractitioner, 0);

  const stats = [
    { label: 'Total encaissé', value: `${totalEncaisse.toFixed(2)} $`, color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', rune: 'ᚠ' },
    { label: 'Commission (35%)', value: `${totalCommission.toFixed(2)} $`, color: '#6B3FA0', bg: '#EDE9FE', border: '#C4B5FD', rune: 'ᚲ' },
    { label: 'Versé praticiens (65%)', value: `${totalPraticiens.toFixed(2)} $`, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD', rune: 'ᛟ' },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᚴ Revenus Holistiques
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Suivi des paiements et des reversements praticiens
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: s.color }}>
                {s.rune}
              </div>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', fontFamily: 'var(--font-cinzel, serif)' }}>{s.label}</p>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-cinzel, serif)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {payments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem' }}>Aucun paiement enregistré</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Date', 'Client', 'Praticien', 'Montant total', 'Commission (35%)', 'Versement praticien (65%)', 'Statut'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.72rem', fontWeight: 600, color: '#6B3FA0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  {/* Date */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                      {new Date(p.createdAt).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {p.paidAt && (
                      <p style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                        Payé le {new Date(p.paidAt).toLocaleDateString('fr-CA')}
                      </p>
                    )}
                  </td>
                  {/* Client */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 500, color: '#1F2937', fontSize: '0.9rem' }}>
                      {p.appointment.client.firstName} {p.appointment.client.lastName}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{p.appointment.client.email}</p>
                  </td>
                  {/* Practitioner */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 500, color: '#1F2937', fontSize: '0.9rem' }}>
                      {p.appointment.practitioner.user.firstName} {p.appointment.practitioner.user.lastName}
                    </p>
                  </td>
                  {/* Amount total */}
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1F2937', fontSize: '0.95rem' }}>
                    {p.amountTotal.toFixed(2)} $
                  </td>
                  {/* Commission */}
                  <td style={{ padding: '14px 16px', color: '#6B3FA0', fontWeight: 600, fontSize: '0.9rem' }}>
                    {p.amountCommission.toFixed(2)} $
                  </td>
                  {/* Payout */}
                  <td style={{ padding: '14px 16px', color: '#1E40AF', fontWeight: 600, fontSize: '0.9rem' }}>
                    {p.amountPractitioner.toFixed(2)} $
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <PaymentStatusBadge status={p.status} />
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
