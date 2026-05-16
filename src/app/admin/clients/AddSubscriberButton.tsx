'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddSubscriberButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/infolettre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Erreur inconnue');
        return;
      }
      setOpen(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontFamily: 'sans-serif',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    fontFamily: 'var(--font-cinzel, serif)',
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 14px',
          background: '#6B3FA0',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-cinzel, serif)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        + Ajouter manuellement
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel, serif)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#2D1B4E',
                marginBottom: '6px',
              }}
            >
              Ajouter un abonné à l&apos;infolettre
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '18px' }}>
              Pour saisir une inscription papier ou ajouter un contact manuellement.
              Source = <code>manual</code>.
            </p>

            <form onSubmit={submit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  style={inputStyle}
                  placeholder="Prénom (optionnel)"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  style={inputStyle}
                  placeholder="Nom (optionnel)"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>
                  Courriel <span style={{ color: '#C41D6E' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  placeholder="email@exemple.com"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                  placeholder="(514) 555-1234"
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  style={{
                    padding: '8px 16px',
                    background: '#F3F4F6',
                    color: '#6B7280',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    padding: '8px 16px',
                    background: busy ? '#9CA3AF' : '#6B3FA0',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-cinzel, serif)',
                    cursor: busy ? 'wait' : 'pointer',
                  }}
                >
                  {busy ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
            </form>

            <p
              style={{
                marginTop: '14px',
                fontSize: '0.7rem',
                color: '#9CA3AF',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              ⚠️ En tant qu&apos;admin, tu certifies que cette personne a consenti à recevoir
              l&apos;infolettre. Conserve la trace papier si applicable (Loi 25).
            </p>
          </div>
        </div>
      )}
    </>
  );
}
