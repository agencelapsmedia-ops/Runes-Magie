'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function MarkPaidButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function markPaid() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/holistique/appointments/${appointmentId}/mark-paid`, { method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? 'Échec.');
          return;
        }
        router.refresh();
      } catch {
        setError('Erreur réseau.');
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={markPaid}
        disabled={pending}
        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: '6px', cursor: pending ? 'default' : 'pointer' }}
      >
        {pending ? '…' : 'Marquer payé'}
      </button>
      {error && <p style={{ color: '#DC2626', fontSize: '0.72rem', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}
