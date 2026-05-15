'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SyncResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  mode: 'dry-run' | 'apply';
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errorsCount: number;
  errors: Array<{ cloverId: string; name: string; reason: string }>;
  preview?: Array<{
    action: 'create' | 'update' | 'skip';
    cloverId: string;
    name: string;
    matchedBy?: 'cloverId' | 'sku' | 'slug';
    changes?: Record<string, { from: unknown; to: unknown }>;
  }>;
}

export default function CloverSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState<'dry-run' | 'apply' | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync(mode: 'dry-run' | 'apply') {
    if (mode === 'apply') {
      const confirmed = window.confirm(
        'Confirmer le sync RÉEL ? Les produits du site seront créés/modifiés selon Clover. (Tu peux d\'abord faire un aperçu)',
      );
      if (!confirmed) return;
    }

    setLoading(mode);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/clover/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erreur serveur');
        return;
      }

      setResult(data);

      // Refresh la page après un sync apply pour mettre à jour les stats
      if (mode === 'apply') {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {/* Boutons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={() => runSync('dry-run')}
          disabled={loading !== null}
          style={{
            padding: '10px 20px',
            background: loading === 'dry-run' ? '#9CA3AF' : '#6B7280',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'var(--font-cinzel, serif)',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null && loading !== 'dry-run' ? 0.5 : 1,
          }}
        >
          {loading === 'dry-run' ? 'Aperçu en cours…' : '🔍 Aperçu (dry-run)'}
        </button>
        <button
          onClick={() => runSync('apply')}
          disabled={loading !== null}
          style={{
            padding: '10px 20px',
            background: loading === 'apply' ? '#5B21B6' : '#6B3FA0',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'var(--font-cinzel, serif)',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            opacity: loading !== null && loading !== 'apply' ? 0.5 : 1,
          }}
        >
          {loading === 'apply' ? 'Sync en cours…' : '✦ Synchroniser maintenant'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '0.9rem',
            marginBottom: '16px',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* Résultat */}
      {result && <SyncResultDisplay result={result} />}
    </div>
  );
}

function SyncResultDisplay({ result }: { result: SyncResult }) {
  const isDryRun = result.mode === 'dry-run';

  return (
    <div
      style={{
        background: isDryRun ? '#F3F4F6' : '#EDE9FE',
        border: `1px solid ${isDryRun ? '#D1D5DB' : '#C4B5FD'}`,
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#2D1B4E',
          marginBottom: '12px',
        }}
      >
        {isDryRun ? '🔍 Aperçu (rien n\'a été modifié)' : '✓ Synchronisation terminée'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <Stat label="Récupérés de Clover" value={result.itemsFetched} color="#4B5563" />
        <Stat label="Créés" value={result.itemsCreated} color="#065F46" />
        <Stat label="Mis à jour" value={result.itemsUpdated} color="#1E3A8A" />
        <Stat label="Erreurs" value={result.errorsCount} color={result.errorsCount > 0 ? '#991B1B' : '#9CA3AF'} />
      </div>

      {/* Aperçu détaillé (dry-run uniquement) */}
      {isDryRun && result.preview && result.preview.length > 0 && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#6B3FA0' }}>
            Voir le détail ({result.preview.length} item{result.preview.length > 1 ? 's' : ''})
          </summary>
          <div style={{ marginTop: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {result.preview.map((p) => (
              <div
                key={p.cloverId}
                style={{
                  padding: '8px 12px',
                  marginBottom: '4px',
                  background: '#FFFFFF',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  borderLeft: `3px solid ${p.action === 'create' ? '#10B981' : p.action === 'update' ? '#3B82F6' : '#D1D5DB'}`,
                }}
              >
                <div>
                  <strong>{p.name}</strong>{' '}
                  <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    [{p.action}] {p.matchedBy && `via ${p.matchedBy}`}
                  </span>
                </div>
                {p.changes && Object.keys(p.changes).length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                    {Object.entries(p.changes).map(([field, c]) => (
                      <div key={field}>
                        <code>{field}</code>: <span style={{ color: '#991B1B' }}>{JSON.stringify(c.from)}</span>{' '}
                        → <span style={{ color: '#065F46' }}>{JSON.stringify(c.to)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Erreurs */}
      {result.errors.length > 0 && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#991B1B' }}>
            Voir les erreurs ({result.errors.length})
          </summary>
          <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {result.errors.map((e, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  marginBottom: '4px',
                  background: '#FEE2E2',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#991B1B',
                }}
              >
                <strong>{e.name}</strong> ({e.cloverId}) : {e.reason}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '6px' }}>
      <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
