import { prisma } from '@/lib/db';
import CloverSyncButton from './CloverSyncButton';
import QueuePanel from './QueuePanel';

export default async function CloverAdminPage() {
  const isConfigured = Boolean(process.env.CLOVER_MERCHANT_ID && process.env.CLOVER_API_TOKEN);

  const [productsTotal, productsSynced, recentLogs, queueCounts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { cloverId: { not: null } } }),
    prisma.cloverSyncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
    prisma.cloverSyncQueue.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const queueByStatus: Record<string, number> = {};
  for (const c of queueCounts) {
    queueByStatus[c.status] = c._count.id;
  }
  const pendingCount = queueByStatus['PENDING'] ?? 0;
  const failedCount = queueByStatus['FAILED_MAX_ATTEMPTS'] ?? 0;
  const retryingCount = queueByStatus['FAILED_RETRYING'] ?? 0;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᚦ Synchronisation Clover
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Synchronise l&apos;inventaire de ta boutique physique (Clover POS) avec le site
        </p>
      </div>

      {!isConfigured && <ConfigurationMissing />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Produits site" value={productsTotal.toString()} icon="ᚲ" />
        <StatCard
          label="Liés à Clover"
          value={productsSynced.toString()}
          icon="ᛒ"
          highlight={productsSynced > 0}
        />
        <StatCard
          label="Dernier sync"
          value={recentLogs[0] ? formatRelative(recentLogs[0].startedAt) : '—'}
          icon="ᛃ"
        />
      </div>

      {/* Queue de synchronisation (alerte si quelque chose en attente) */}
      {(pendingCount + retryingCount + failedCount) > 0 && (
        <QueuePanel
          pendingCount={pendingCount}
          retryingCount={retryingCount}
          failedCount={failedCount}
        />
      )}

      {/* Bouton sync */}
      {isConfigured && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '12px' }}>
            Lancer une synchronisation
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '16px', lineHeight: 1.5 }}>
            <strong>Mode aperçu (dry-run)</strong> : récupère les items de Clover et te montre ce qui changerait, sans rien modifier dans la base.
            <br />
            <strong>Mode appliquer</strong> : exécute réellement les modifications (création + mise à jour des produits).
          </p>
          <CloverSyncButton />
        </div>
      )}

      {/* Historique */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '12px' }}>
          Historique des synchronisations
        </h2>
        {recentLogs.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', textAlign: 'center', padding: '32px 0' }}>
            Aucune synchronisation pour le moment.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Date', 'Mode', 'Statut', 'Fetched', 'Créés', 'Mis à jour', 'Ignorés', 'Erreurs', 'Durée'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-cinzel, serif)',
                      fontSize: '0.7rem',
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
              {recentLogs.map((log, idx) => {
                const duration = log.finishedAt
                  ? Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)
                  : null;
                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#4B5563' }}>
                      {new Date(log.startedAt).toLocaleString('fr-CA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem' }}>
                      <ModeBadge mode={log.mode} />
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem' }}>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#4B5563' }}>{log.itemsFetched}</td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#065F46', fontWeight: 600 }}>
                      {log.itemsCreated > 0 ? `+${log.itemsCreated}` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#1E3A8A', fontWeight: 600 }}>
                      {log.itemsUpdated > 0 ? `~${log.itemsUpdated}` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#9CA3AF' }}>{log.itemsSkipped}</td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: log.errorsCount > 0 ? '#991B1B' : '#9CA3AF', fontWeight: log.errorsCount > 0 ? 600 : 400 }}>
                      {log.errorsCount > 0 ? log.errorsCount : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#6B7280' }}>
                      {duration !== null ? `${duration}s` : 'en cours…'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function ConfigurationMissing() {
  return (
    <div
      style={{
        background: '#FEF3C7',
        border: '1px solid #FCD34D',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem', fontWeight: 700, color: '#92400E', marginBottom: '12px' }}>
        ⚠ Configuration Clover manquante
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#78350F', marginBottom: '12px', lineHeight: 1.6 }}>
        Pour activer la synchronisation, ajoute ces 2 variables d&apos;environnement dans Vercel :
      </p>
      <pre
        style={{
          background: '#FFFBEB',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          color: '#78350F',
          fontFamily: 'monospace',
          border: '1px solid #FCD34D',
          marginBottom: '12px',
          whiteSpace: 'pre-wrap',
        }}
      >
{`CLOVER_MERCHANT_ID=ton-merchant-id
CLOVER_API_TOKEN=ton-token-api
CLOVER_REGION=us`}
      </pre>
      <p style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.6 }}>
        <strong>Où trouver ces valeurs :</strong>
        <br />
        1. Connecte-toi sur <code>https://www.clover.com/dashboard</code>
        <br />
        2. <strong>Merchant ID</strong> : visible en haut de la page Setup, ou dans l&apos;URL
        <br />
        3. <strong>API Token</strong> : Setup → API Tokens → Create new token → cocher{' '}
        <code>inventory:read</code>
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string; border: string; label: string }> = {
    RUNNING: { bg: '#DBEAFE', fg: '#1E3A8A', border: '#93C5FD', label: 'En cours' },
    SUCCESS: { bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7', label: 'Succès' },
    PARTIAL: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D', label: 'Partiel' },
    FAILED: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5', label: 'Échec' },
  };
  const s = styles[status] ?? styles.RUNNING;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const isApply = mode === 'apply';
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: isApply ? '#EDE9FE' : '#F3F4F6', color: isApply ? '#6B3FA0' : '#6B7280', border: `1px solid ${isApply ? '#C4B5FD' : '#D1D5DB'}` }}>
      {isApply ? 'Appliqué' : 'Aperçu'}
    </span>
  );
}

function StatCard({ label, value, icon, highlight = false }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: highlight ? '1px solid #C9A84C' : '1px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-cinzel, serif)', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2D1B4E', lineHeight: 1 }}>{value}</p>
        </div>
        <div style={{ fontSize: '1.8rem', color: highlight ? '#C9A84C' : '#E9D5FF', opacity: 0.6, userSelect: 'none' }}>{icon}</div>
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}
