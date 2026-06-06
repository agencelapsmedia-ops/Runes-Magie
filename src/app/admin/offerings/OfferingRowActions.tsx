'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleOfferingActive, deleteOffering } from './actions';

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  border: '1px solid',
  borderRadius: '6px',
  background: '#FFFFFF',
  padding: 0,
};

function EyeOpen() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Trash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function OfferingRowActions({
  offeringId,
  isActive,
}: {
  offeringId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [toggling, startToggle] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function handleToggle() {
    startToggle(async () => {
      await toggleOfferingActive(offeringId);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement ce service ? Cette action est irréversible.')) return;
    setDeleting(true);
    try {
      const res = await deleteOffering(offeringId);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error ?? 'Suppression impossible.');
        setDeleting(false);
      }
    } catch {
      alert('Une erreur est survenue lors de la suppression.');
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a
        href={`/admin/offerings/${offeringId}/edit`}
        style={{ padding: '6px 14px', background: '#EDE9FE', color: '#6B3FA0', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)' }}
      >
        Modifier
      </a>

      {/* Œil : visible ou masqué (bascule l'activation) */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        title={isActive ? 'Visible — cliquer pour masquer' : 'Masqué — cliquer pour rendre visible'}
        aria-label={isActive ? 'Masquer ce service' : 'Rendre ce service visible'}
        style={{
          ...iconBtn,
          borderColor: isActive ? '#6EE7B7' : '#D1D5DB',
          color: isActive ? '#059669' : '#9CA3AF',
          opacity: toggling ? 0.5 : 1,
          cursor: toggling ? 'wait' : 'pointer',
        }}
      >
        {isActive ? <EyeOpen /> : <EyeOff />}
      </button>

      {/* Supprimer */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        title="Supprimer ce service"
        aria-label="Supprimer ce service"
        style={{
          ...iconBtn,
          borderColor: '#FCA5A5',
          color: '#DC2626',
          opacity: deleting ? 0.5 : 1,
          cursor: deleting ? 'wait' : 'pointer',
        }}
      >
        <Trash />
      </button>
    </div>
  );
}
