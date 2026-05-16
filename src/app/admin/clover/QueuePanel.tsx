'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  pendingCount: number;
  retryingCount: number;
  failedCount: number;
}

interface QueueItem {
  id: string;
  productId: string;
  action: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  nextAttemptAt: string;
  createdAt: string;
}

interface QueueData {
  pending: QueueItem[];
  processing: QueueItem[];
  failed: QueueItem[];
  counts: { pending: number; processing: number; failed: number };
}

export default function QueuePanel({ pendingCount, retryingCount, failedCount }: Props) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [details, setDetails] = useState<QueueData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number; exhausted: number } | null>(null);

  async function processQueue() {
    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/clover/retry-queue', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResult({ succeeded: data.succeeded, failed: data.failed, exhausted: data.exhausted });
        router.refresh();
      } else {
        alert(`Erreur: ${data.error ?? 'inconnue'}`);
      }
    } catch (err) {
      alert(`Erreur réseau: ${err instanceof Error ? err.message : 'inconnue'}`);
    } finally {
      setProcessing(false);
    }
  }

  async function loadDetails() {
    if (showDetails) {
      setShowDetails(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/clover/retry-queue');
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
        setShowDetails(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const isCritical = failedCount > 0;
  const totalActive = pendingCount + retryingCount + failedCount;

  return (
    <div
      style={{
        background: isCritical ? '#FEF2F2' : '#FEF3C7',
        border: `1px solid ${isCritical ? '#FCA5A5' : '#FCD34D'}`,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-cinzel, serif)',
              fontSize: '1rem',
              fontWeight: 700,
              color: isCritical ? '#991B1B' : '#92400E',
              marginBottom: '8px',
            }}
          >
            {isCritical ? '⚠ ' : '⏳ '}Queue de synchronisation Clover — {totalActive} opération{totalActive > 1 ? 's' : ''} en attente
          </h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#78350F' }}>
            {pendingCount > 0 && <span>📥 {pendingCount} en attente</span>}
            {retryingCount > 0 && <span>🔄 {retryingCount} en re-essai</span>}
            {failedCount > 0 && <span style={{ color: '#991B1B', fontWeight: 600 }}>❌ {failedCount} échec(s) définitif(s)</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={loadDetails}
            style={{
              padding: '8px 14px',
              background: '#FFFFFF',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-cinzel, serif)',
            }}
          >
            {showDetails ? 'Masquer détails' : 'Voir détails'}
          </button>
          <button
            onClick={processQueue}
            disabled={processing}
            style={{
              padding: '8px 14px',
              background: processing ? '#9CA3AF' : '#6B3FA0',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: processing ? 'wait' : 'pointer',
              fontFamily: 'var(--font-cinzel, serif)',
            }}
          >
            {processing ? 'Traitement…' : '✦ Traiter maintenant'}
          </button>
        </div>
      </div>

      {result && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#1F2937',
          }}
        >
          ✓ Traité — <strong>{result.succeeded}</strong> succès, <strong>{result.failed}</strong> en retry, <strong>{result.exhausted}</strong> abandonné(s).
        </div>
      )}

      {showDetails && details && (
        <div style={{ marginTop: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {[...details.failed, ...details.processing, ...details.pending].map((item) => (
            <div
              key={item.id}
              style={{
                padding: '8px 12px',
                marginBottom: '4px',
                background: '#FFFFFF',
                borderRadius: '4px',
                fontSize: '0.8rem',
                borderLeft: `3px solid ${
                  item.status === 'FAILED_MAX_ATTEMPTS' ? '#EF4444' :
                  item.status === 'FAILED_RETRYING' ? '#F59E0B' :
                  '#3B82F6'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <strong style={{ fontFamily: 'monospace' }}>{item.action}</strong>
                  <span style={{ marginLeft: '8px', color: '#6B7280' }}>
                    Product ID: <code>{item.productId.slice(0, 8)}…</code>
                  </span>
                </div>
                <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Tentative {item.attempts}/{item.maxAttempts}
                </span>
              </div>
              {item.lastError && (
                <div style={{ marginTop: '4px', color: '#991B1B', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {item.lastError}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
