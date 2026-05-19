'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RelinkResult {
  dryRun: boolean;
  total: number;
  untouched: number;
  skipped: number;
  addedLinks: number;
  removedLinks: number;
  errors: number;
  samples: Array<{
    name: string;
    category: string;
    added: string[];
    removed: string[];
    skipReason?: string;
  }>;
}

/**
 * Bouton de rattrapage pour re-lier tous les produits à leur catégorie Clover.
 * Utile après un fix de logique de mapping (cas du 19 mai : les catégories
 * "Cours & Formations" et "Apothicaire" n'étaient pas dans la liste hardcodée).
 */
export default function RelinkCategoriesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState<'dry' | 'apply' | null>(null);
  const [result, setResult] = useState<RelinkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    if (!dryRun && !window.confirm('Réparer les liaisons catégorie de tous les produits Clover ?\n\nLes liaisons manquantes seront ajoutées, les obsolètes retirées.')) return;

    setLoading(dryRun ? 'dry' : 'apply');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/clover/relink-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
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
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: '1rem',
          fontWeight: 700,
          color: '#2D1B4E',
          marginBottom: '8px',
        }}
      >
        🔗 Réparer les liaisons catégorie Clover
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '16px', lineHeight: 1.5 }}>
        Pour chaque produit lié à Clover, vérifie qu&apos;il pointe vers la bonne catégorie Clover (selon sa catégorie site). Utile si tu as ajouté des catégories
        ou si des produits manquent de leur catégorie côté Clover.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => run(true)}
          disabled={loading !== null}
          style={{
            padding: '10px 20px',
            background: loading === 'dry' ? '#9CA3AF' : '#6B7280',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'var(--font-cinzel, serif)',
            cursor: loading !== null ? 'wait' : 'pointer',
          }}
        >
          {loading === 'dry' ? 'Aperçu…' : '🔍 Aperçu (rien modifier)'}
        </button>
        <button
          onClick={() => run(false)}
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
            cursor: loading !== null ? 'wait' : 'pointer',
          }}
        >
          {loading === 'apply' ? 'Réparation…' : '✦ Réparer maintenant'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', color: '#991B1B', fontSize: '0.9rem' }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '16px', background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.95rem', fontWeight: 700, color: '#065F46', marginBottom: '12px' }}>
            {result.dryRun ? '🔍 Aperçu — rien modifié' : '✓ Liaisons réparées'}
          </h4>
          <div style={{ fontSize: '0.85rem', color: '#1F2937', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>{result.total}</strong> produits inspectés · <strong>{result.untouched}</strong> déjà OK · <strong>{result.addedLinks}</strong> liaisons ajoutées · <strong>{result.removedLinks}</strong> retirées · <strong>{result.skipped}</strong> skippés · <strong>{result.errors}</strong> erreurs
          </div>
          {result.samples.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#6B3FA0' }}>
                Détail (premiers {result.samples.length} produits affectés)
              </summary>
              <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto', fontSize: '0.8rem' }}>
                {result.samples.map((s, i) => (
                  <div key={i} style={{ padding: '6px 12px', marginBottom: '4px', background: s.skipReason ? '#FEF3C7' : '#F9FAFB', borderRadius: '4px' }}>
                    <strong>{s.name}</strong> <span style={{ color: '#6B7280' }}>({s.category})</span>
                    {s.skipReason && <div style={{ color: '#92400E', fontSize: '0.75rem' }}>⏭ {s.skipReason}</div>}
                    {s.added.length > 0 && <div style={{ color: '#065F46', fontSize: '0.75rem' }}>+ ajouté {s.added.length} liaison(s)</div>}
                    {s.removed.length > 0 && <div style={{ color: '#991B1B', fontSize: '0.75rem' }}>− retiré {s.removed.length} liaison(s)</div>}
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
