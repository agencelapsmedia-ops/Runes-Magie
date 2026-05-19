'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PushResult {
  total: number;
  pushOk: number;
  pushFail: number;
  errors: Array<{ productId: string; sku: string; error: string }>;
}

/**
 * Bouton de rattrapage pour pousser le SKU de tous les produits liés vers Clover.
 * Utile après la migration SKU 4-chiffres (regenerate-skus.ts) où la DB locale
 * a été mise à jour mais pas Clover (vars Sensitive non pullables).
 */
export default function PushAllSkusButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PushResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function push() {
    if (!window.confirm('Pousser le SKU actuel de tous les produits vers Clover ?\n\nUtile après une migration SKU. Les opérations qui échouent partent en queue de retry.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/clover/push-all-skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
      setLoading(false);
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
        🔁 Re-synchroniser tous les SKU vers Clover
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '16px', lineHeight: 1.5 }}>
        Pousse le SKU actuel de tous les produits liés à Clover. À utiliser
        après une migration SKU ou un changement en masse de format SKU.
      </p>

      <button
        onClick={push}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#9CA3AF' : '#6B3FA0',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 600,
          fontFamily: 'var(--font-cinzel, serif)',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Push en cours… (~1 min)' : '↑ Pousser tous les SKU vers Clover'}
      </button>

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
            background: '#F0FDF4',
            border: '1px solid #D1FAE5',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h4 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.95rem', fontWeight: 700, color: '#065F46', marginBottom: '12px' }}>
            ✓ Push terminé
          </h4>
          <div style={{ fontSize: '0.85rem', color: '#1F2937' }}>
            <strong>{result.pushOk}</strong> SKU synchronisés sur Clover · <strong>{result.pushFail}</strong> en queue de retry · <strong>{result.total}</strong> total
          </div>
          {result.errors.length > 0 && (
            <details style={{ marginTop: '12px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#991B1B' }}>
                Voir les erreurs ({result.errors.length})
              </summary>
              <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', fontSize: '0.75rem', color: '#991B1B' }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ padding: '4px 0' }}>
                    SKU {e.sku} : {e.error}
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
