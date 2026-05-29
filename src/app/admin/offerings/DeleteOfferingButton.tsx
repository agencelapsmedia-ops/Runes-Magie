'use client';

import { deleteOffering } from './actions';

export default function DeleteOfferingButton({ offeringId }: { offeringId: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('Supprimer définitivement ce service ? Cette action est irréversible.')) {
      e.preventDefault();
    }
  }

  return (
    <form action={deleteOffering.bind(null, offeringId)} onSubmit={handleSubmit}>
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-cinzel, serif)',
        }}
      >
        Supprimer
      </button>
    </form>
  );
}
