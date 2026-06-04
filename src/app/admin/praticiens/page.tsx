import { prisma } from '@/lib/db';
import DeleteButton from './DeleteButton';

async function getPractitioners(status: string) {
  return prisma.practitioner.findMany({
    where: { status },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    PENDING: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' },
    APPROVED: { background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' },
    REJECTED: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' },
  };
  const labels: Record<string, string> = {
    PENDING: 'En attente',
    APPROVED: 'Approuvé',
    REJECTED: 'Rejeté',
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      fontFamily: 'var(--font-cinzel, serif)',
      ...(styles[status] ?? styles.PENDING),
    }}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function PraticiensAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; newPassword?: string; newEmail?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? 'PENDING';
  const newPassword = params.newPassword;
  const newEmail = params.newEmail;

  const [pending, approved, rejected] = await Promise.all([
    getPractitioners('PENDING'),
    getPractitioners('APPROVED'),
    getPractitioners('REJECTED'),
  ]);

  const lists: Record<string, Awaited<ReturnType<typeof getPractitioners>>> = {
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected,
  };

  const tabs = [
    { key: 'PENDING', label: `En attente (${pending.length})` },
    { key: 'APPROVED', label: `Approuvés (${approved.length})` },
    { key: 'REJECTED', label: `Rejetés (${rejected.length})` },
  ];

  const practitioners = lists[tab] ?? pending;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
            ᚻ Praticiens Holistiques
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
            Gérez les demandes d&apos;inscription et les fiches des praticiens
          </p>
        </div>
        <a
          href="/admin/praticiens/nouveau"
          style={{
            padding: '10px 20px',
            background: '#6B3FA0',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          + Nouveau praticien
        </a>
      </div>

      {/* Bandeau mot de passe généré (affiché une seule fois après création) */}
      {newPassword && newEmail && (
        <div
          style={{
            background: '#FEF3C7',
            border: '2px solid #FCD34D',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem', color: '#92400E', marginBottom: '8px' }}>
            ⚠ Praticien créé — Mot de passe à transmettre maintenant
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#78350F', marginBottom: '12px' }}>
            Voici les identifiants à communiquer au praticien. <strong>Ils ne seront plus affichés</strong> après avoir quitté cette page.
          </p>
          <div style={{ display: 'grid', gap: '8px', fontFamily: 'monospace', background: '#FFFBEB', padding: '12px', borderRadius: '6px' }}>
            <div><strong>Email :</strong> {newEmail}</div>
            <div><strong>Mot de passe :</strong> <code style={{ background: '#FDE68A', padding: '2px 8px', borderRadius: '4px', userSelect: 'all' }}>{newPassword}</code></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/praticiens?tab=${t.key}`}
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
            {t.label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {practitioners.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem' }}>Aucun praticien dans cette catégorie</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Praticien', 'Email', 'Spécialités', 'Expérience', 'Tarif', 'Statut', 'Inscrit le', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {practitioners.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  {/* Name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photoUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E9D5FF' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#6B3FA0' }}>
                          ᚻ
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                          {p.user.firstName} {p.user.lastName}
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>{p.user.email}</td>
                  {/* Specialties */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {p.specialties.map((s) => (
                        <span key={s} style={{ padding: '2px 8px', background: '#EDE9FE', color: '#6B3FA0', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 500 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* Experience */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>{p.yearsExperience} ans</td>
                  {/* Rate */}
                  <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                    {(p.hourlyRate * 1.5).toFixed(2)} $/séance
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={p.status} /></td>
                  {/* Created */}
                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                    {new Date(p.createdAt).toLocaleDateString('fr-CA')}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {p.status === 'APPROVED' && (
                        <a
                          href={`/soins/praticiens/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Voir la fiche publique du praticien (nouvel onglet)"
                          style={{ padding: '6px 14px', background: '#CCFBF1', color: '#0F766E', border: '1px solid #5EEAD4', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)', textDecoration: 'none' }}
                        >
                          Voir
                        </a>
                      )}
                      <a
                        href={`/admin/praticiens/${p.id}/edit`}
                        style={{ padding: '6px 14px', background: '#EDE9FE', color: '#6B3FA0', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)', textDecoration: 'none' }}
                      >
                        Modifier
                      </a>
                      {p.status === 'PENDING' && (
                        <>
                          <form action={`/api/admin/holistic/practitioners/${p.id}`} method="POST">
                            <input type="hidden" name="_method" value="PUT" />
                            <input type="hidden" name="action" value="approve" />
                            <button
                              type="submit"
                              style={{ padding: '6px 14px', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)' }}
                            >
                              Approuver
                            </button>
                          </form>
                          <form action={`/api/admin/holistic/practitioners/${p.id}`} method="POST">
                            <input type="hidden" name="_method" value="PUT" />
                            <input type="hidden" name="action" value="reject" />
                            <button
                              type="submit"
                              style={{ padding: '6px 14px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)' }}
                            >
                              Rejeter
                            </button>
                          </form>
                        </>
                      )}
                      {p.status === 'APPROVED' && (
                        <form action={`/api/admin/holistic/practitioners/${p.id}`} method="POST">
                          <input type="hidden" name="_method" value="PUT" />
                          <input type="hidden" name="action" value="reject" />
                          <button
                            type="submit"
                            style={{ padding: '6px 14px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)' }}
                          >
                            Suspendre
                          </button>
                        </form>
                      )}
                      {p.status === 'REJECTED' && (
                        <form action={`/api/admin/holistic/practitioners/${p.id}`} method="POST">
                          <input type="hidden" name="_method" value="PUT" />
                          <input type="hidden" name="action" value="approve" />
                          <button
                            type="submit"
                            style={{ padding: '6px 14px', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)' }}
                          >
                            Réactiver
                          </button>
                        </form>
                      )}
                      <DeleteButton id={p.id} name={`${p.user.firstName} ${p.user.lastName}`.trim()} />
                    </div>
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
