'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PushResult {
  totalOrphans: number;
  synced: number;
  queued: number;
  results: Array<{
    categoryId: string;
    name: string;
    status: 'synced' | 'queued';
    cloverCategoryId?: string;
  }>;
}

export default function PushOrphanCategoriesButton({ orphanCount }: { orphanCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PushResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function push(opts: { limit?: number }) {
    const message = opts.limit
      ? `Tester en poussant ${opts.limit} catégorie(s) vers Clover ?`
      : `Pousser TOUTES les ${orphanCount} catégories vers Clover ?\n\nElles apparaîtront dans ton inventaire Clover.`;
    if (!window.confirm(message)) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = opts.limit
        ? `/api/admin/clover/push-orphan-categories?limit=${opts.limit}`
        : '/api/admin/clover/push-orphan-categories';
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

  if (orphanCount === 0 && !result) return null;

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
        ⚠ Catégories non synchronisées vers Clover
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#78350F', marginBottom: '16px', lineHeight: 1.5 }}>
        <strong>{orphanCount}</strong> catégorie{orphanCount > 1 ? 's' : ''}{' '}
        {orphanCount > 1 ? 'sont marquées' : 'est marquée'} comme à synchroniser mais{' '}
        {orphanCount > 1 ? 'n\'ont' : 'n\'a'} pas encore été poussée{orphanCount > 1 ? 's' : ''} vers Clover.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => push({ limit: 1 })}
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
          }}
        >
          {loading ? '…' : '🧪 Tester avec 1 catégorie'}
        </button>
        <button
          onClick={() => push({})}
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
          }}
        >
          {loading ? 'Push…' : `↑ Pousser toutes les ${orphanCount} catégories`}
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
          <div style={{ fontSize: '0.85rem', color: '#1F2937', marginBottom: '12px' }}>
            <strong>{result.synced}</strong> synchronisées · <strong>{result.queued}</strong> en queue de retry · <strong>{result.totalOrphans}</strong> total
          </div>
          {result.results.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#6B3FA0' }}>
                Voir le détail
              </summary>
              <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {result.results.map((r) => (
                  <div
                    key={r.categoryId}
                    style={{
                      padding: '6px 12px',
                      marginBottom: '4px',
                      background: r.status === 'synced' ? '#F0FDF4' : '#FEF3C7',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      borderLeft: `3px solid ${r.status === 'synced' ? '#10B981' : '#F59E0B'}`,
                    }}
                  >
                    <strong>{r.name}</strong>{' '}
                    <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                      [{r.status === 'synced' ? `✓ cloverId=${r.cloverCategoryId}` : '⏳ en queue'}]
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
