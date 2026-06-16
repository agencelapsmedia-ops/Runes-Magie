'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  appointmentId: string;
  /** Date/heure actuelle du RDV, ISO, pour préremplir le sélecteur. */
  currentStartsAt: string;
  /** Style du bouton : sombre (dashboard praticienne) ou clair (admin). */
  variant?: 'dark' | 'light';
}

/** Convertit une date ISO en valeur `datetime-local` (heure locale du navigateur). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export default function RescheduleButton({ appointmentId, currentStartsAt, variant = 'dark' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toLocalInput(currentStartsAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/holistique/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startsAt: new Date(value).toISOString() }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? 'Échec du déplacement.');
          return;
        }
        setOpen(false);
        router.refresh();
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  const btnStyle: React.CSSProperties =
    variant === 'light'
      ? { padding: '6px 14px', fontSize: '0.8rem', background: '#EDE9FE', color: '#6B3FA0', border: '1px solid #C4B5FD', borderRadius: '6px', cursor: 'pointer' }
      : { padding: '9px 20px', fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(201,168,76,0.12)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '2px', cursor: 'pointer' };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={btnStyle}>
        Déplacer
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #C4B5FD' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" onClick={submit} disabled={pending} style={{ ...btnStyle, opacity: pending ? 0.6 : 1 }}>
          {pending ? '…' : 'Confirmer'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          disabled={pending}
          style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'transparent', color: '#9CA3AF', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
    </div>
  );
}
