'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PushResult {
  totalOrphans: number;
  synced: number;
  queued: number;
  results: Array<{
    productId: string;
    name: string;
    status: 'synced' | 'queued';
    cloverId?: string;
  }>;
}

export default function PushOrphansButton({ orphanCount }: { orphanCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PushResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function push(opts: { limit?: number; label: string }) {
    const message = opts.limit
      ? `Tester en poussant ${opts.limit} produit(s) du site vers Clover ?\n\nIls apparaîtront dans ton inventaire Clover. Si ça marche, on poussera les autres.`
      : `Pousser TOUS les ${orphanCount} produits du site vers Clover ?\n\nIls apparaîtront dans ton inventaire Clover. Cette opération ne peut pas être annulée automatiquement (il faudrait les supprimer manuellement sur Clover).`;
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = opts.limit
        ? `/api/admin/clover/push-orphans?limit=${opts.limit}`
        : '/api/admin/clover/push-orphans';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur serveur');
        return;
      }
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (orphanCount === 0 && !result) {
    return null;
  }

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
      <h3
        style={{
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: '1rem',
          fontWeight: 700,
          color: '#92400E',
          marginBottom: '8px',
        }}
      >
        ⚠ Produits non synchronisés vers Clover
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#78350F', marginBottom: '16px', lineHeight: 1.5 }}>
        <strong>{orphanCount}</strong> produit{orphanCount > 1 ? 's' : ''} du site {orphanCount > 1 ? 'sont' : 'est'} marqué{orphanCount > 1 ? 's' : ''}{' '}
        comme à synchroniser mais n&apos;{orphanCount > 1 ? 'ont' : 'a'} pas encore été poussé{orphanCount > 1 ? 's' : ''} vers Clover (par exemple parce que
        les credentials Clover étaient absents lors de leur création).
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => push({ limit: 1, label: 'test1' })}
          disabled={loading || orphanCount === 0}
          style={{
            padding: '10px 20px',
            background: loading ? '#9CA3AF' : '#6B7280',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'var(--font-cinzel, serif)',
            cursor: loading || orphanCount === 0 ? 'not-allowed' : 'pointer',
            opacity: orphanCount === 0 ? 0.5 : 1,
          }}
        >
          {loading ? '…' : '🧪 Tester avec 1 produit'}
        </button>
        <button
          onClick={() => push({ label: 'all' })}
          disabled={loading || orphanCount === 0}
          style={{
            padding: '10px 20px',
            background: loading ? '#A16207' : '#92400E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'var(--font-cinzel, serif)',
            cursor: loading || orphanCount === 0 ? 'not-allowed' : 'pointer',
            opacity: orphanCount === 0 ? 0.5 : 1,
          }}
        >
          {loading ? 'Push en cours…' : `↑ Pousser tous les ${orphanCount} produit${orphanCount > 1 ? 's' : ''} vers Clover`}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '16px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '0.9rem',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '16px',
            background: '#FFFFFF',
            border: '1px solid #D1FAE5',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h4 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.95rem', fontWeight: 700, color: '#065F46', marginBottom: '12px' }}>
            ✓ Rattrapage terminé
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <Stat label="Total" value={result.totalOrphans} color="#4B5563" />
            <Stat label="Synchronisés" value={result.synced} color="#065F46" />
            <Stat label="En queue (retry)" value={result.queued} color="#92400E" />
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#6B3FA0' }}>
              Voir le détail
            </summary>
            <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {result.results.map((r) => (
                <div
                  key={r.productId}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '4px',
                    background: r.status === 'synced' ? '#F0FDF4' : '#FEF3C7',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    borderLeft: `3px solid ${r.status === 'synced' ? '#10B981' : '#F59E0B'}`,
                  }}
                >
                  <strong>{r.name}</strong>{' '}
                  <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    [{r.status === 'synced' ? `✓ cloverId=${r.cloverId}` : '⏳ mis en queue de retry'}]
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#F9FAFB', padding: '10px', borderRadius: '6px' }}>
      <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
