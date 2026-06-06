'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOffering } from './actions';

export default function DeleteOfferingButton({ offeringId }: { offeringId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm('Supprimer définitivement ce service ? Cette action est irréversible.')) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await deleteOffering(offeringId);
      if (res.ok) {
        router.push('/admin/offerings');
        router.refresh();
      } else {
        setError(res.error ?? 'Suppression impossible.');
        setPending(false);
      }
    } catch {
      setError('Une erreur est survenue lors de la suppression.');
      setPending(false);
    }
  }

  return (
    <div>
      {/* type="button" : surtout PAS de soumission du formulaire parent (sinon ça enregistre au lieu de supprimer) */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-busy={pending}
        style={{
          padding: '8px 16px',
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: pending ? 'wait' : 'pointer',
          fontFamily: 'var(--font-cinzel, serif)',
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? 'Suppression…' : 'Supprimer'}
      </button>
      {error && (
        <p
          style={{
            color: '#991B1B',
            fontSize: '0.8rem',
            marginTop: '8px',
            maxWidth: '340px',
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
