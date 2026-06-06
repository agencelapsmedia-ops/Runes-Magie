'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{
        padding: '10px 24px',
        background: pending ? '#8B6FB0' : '#6B3FA0',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
        fontFamily: 'var(--font-cinzel, serif)',
        opacity: pending ? 0.85 : 1,
        transition: 'background 0.2s, opacity 0.2s',
      }}
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  );
}
