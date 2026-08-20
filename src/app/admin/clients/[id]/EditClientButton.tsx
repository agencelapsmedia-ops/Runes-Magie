'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

/**
 * Bouton « Modifier » de la fiche client : ouvre un formulaire (prénom, nom,
 * courriel, téléphone) et sauvegarde via PATCH /api/admin/clients/[id].
 * Modal rendu via portal vers <body> (z ≥ 100) pour échapper aux contextes
 * d'empilement du layout admin.
 */
export default function EditClientButton({
  clientId,
  firstName: initialFirstName,
  lastName: initialLastName,
  email: initialEmail,
  phone: initialPhone,
}: {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const close = () => {
    if (saving) return;
    setOpen(false);
    setFeedback(null);
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? 'Échec de la sauvegarde. Réessayez.' });
        return;
      }
      setFeedback({ ok: true, text: 'Informations mises à jour ✓' });
      router.refresh();
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — vérifiez la connexion et réessayez.' });
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B3FA0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '0.9rem',
    color: '#111827',
    marginBottom: '14px',
    boxSizing: 'border-box',
  };
  const canSave = !saving && firstName.trim() && lastName.trim() && email.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Modifier les informations du client"
        style={{
          padding: '10px 18px',
          borderRadius: '8px',
          border: '1px solid #6B3FA0',
          background: '#FFFFFF',
          color: '#6B3FA0',
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ✎ Modifier
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Modifier les informations de ${initialFirstName}`}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(17, 12, 34, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              fontFamily: 'sans-serif',
            }}
            onClick={close}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-cinzel, serif)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#2D1B4E',
                  margin: '0 0 4px',
                }}
              >
                Modifier les informations
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 16px' }}>
                Le courriel sert d'identifiant de connexion du client — il doit rester unique.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Prénom</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nom</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} style={inputStyle} />
                </div>
              </div>

              <label style={labelStyle}>Courriel</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} style={inputStyle} />

              <label style={labelStyle}>Téléphone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="(514) 555-0123" style={{ ...inputStyle, marginBottom: 0 }} />

              {feedback && (
                <p
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: feedback.ok ? '#D1FAE5' : '#FEE2E2',
                    color: feedback.ok ? '#065F46' : '#991B1B',
                    border: `1px solid ${feedback.ok ? '#6EE7B7' : '#FCA5A5'}`,
                  }}
                >
                  {feedback.text}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#4B5563',
                    fontSize: '0.85rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {feedback?.ok ? 'Fermer' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canSave}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: !canSave ? '#C4B5FD' : 'linear-gradient(135deg, #6B3FA0, #4A2D7A)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: !canSave ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
