'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  subscriberId: string;
  unsubscribed: boolean;
  email: string;
}

export default function SubscriberActions({ subscriberId, unsubscribed, email }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'unsubscribe' | 'resubscribe' | 'delete' | null>(null);

  async function run(action: 'unsubscribe' | 'resubscribe' | 'delete') {
    if (action === 'delete') {
      const ok = window.confirm(
        `Supprimer définitivement l'abonné ${email} ?\n\nCette action est irréversible. Utilisez plutôt "Désabonner" si vous voulez juste arrêter les envois.`,
      );
      if (!ok) return;
    }

    setBusy(action);
    try {
      const res = await fetch(`/api/admin/infolettre/${subscriberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Erreur: ${data.error ?? 'inconnue'}`);
        return;
      }
      router.refresh();
    } catch (err) {
      alert(`Erreur réseau: ${err instanceof Error ? err.message : 'inconnue'}`);
    } finally {
      setBusy(null);
    }
  }

  const btn: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '0.7rem',
    fontWeight: 600,
    borderRadius: '4px',
    cursor: busy ? 'wait' : 'pointer',
    fontFamily: 'var(--font-cinzel, serif)',
    border: '1px solid',
    background: 'transparent',
    opacity: busy ? 0.5 : 1,
    marginRight: '4px',
  };

  return (
    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
      {!unsubscribed ? (
        <button
          onClick={() => run('unsubscribe')}
          disabled={busy !== null}
          style={{ ...btn, borderColor: '#FCA5A5', color: '#991B1B' }}
        >
          {busy === 'unsubscribe' ? '…' : 'Désabonner'}
        </button>
      ) : (
        <button
          onClick={() => run('resubscribe')}
          disabled={busy !== null}
          style={{ ...btn, borderColor: '#6EE7B7', color: '#065F46' }}
        >
          {busy === 'resubscribe' ? '…' : 'Réabonner'}
        </button>
      )}
      <button
        onClick={() => run('delete')}
        disabled={busy !== null}
        title="Supprimer définitivement (RGPD / Loi 25 droit à l'oubli)"
        style={{ ...btn, borderColor: '#D1D5DB', color: '#6B7280' }}
      >
        {busy === 'delete' ? '…' : 'Suppr.'}
      </button>
    </div>
  );
}
