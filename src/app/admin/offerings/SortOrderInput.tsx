'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOfferingSortOrder } from './actions';

export default function SortOrderInput({
  offeringId,
  value,
}: {
  offeringId: string;
  value: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(String(value));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  function save() {
    const parsed = Number(current);
    // Rien à faire si inchangé ou invalide
    if (!Number.isFinite(parsed) || parsed === value) {
      setCurrent(String(value));
      return;
    }
    setError(false);
    startTransition(async () => {
      try {
        await updateOfferingSortOrder(offeringId, parsed);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        router.refresh();
      } catch {
        setError(true);
        setCurrent(String(value));
      }
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <input
        type="number"
        value={current}
        disabled={pending}
        onChange={(e) => setCurrent(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          width: '64px',
          padding: '6px 8px',
          border: `1px solid ${error ? '#FCA5A5' : '#D1D5DB'}`,
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#1F2937',
          background: pending ? '#F3F4F6' : '#FFFFFF',
          textAlign: 'center',
          fontFamily: 'inherit',
        }}
        aria-label="Ordre d'affichage"
      />
      {saved && <span style={{ color: '#059669', fontSize: '0.8rem' }}>✓</span>}
      {error && <span style={{ color: '#DC2626', fontSize: '0.72rem' }}>échec</span>}
    </div>
  );
}
