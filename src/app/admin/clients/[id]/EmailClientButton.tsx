'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bouton « Envoyer un courriel » de la fiche client : ouvre un formulaire
 * (sujet + message) et envoie via POST /api/admin/clients/[id]/email.
 * Modal rendu via portal vers <body> (z ≥ 100) pour échapper aux contextes
 * d'empilement du layout admin.
 */
export default function EmailClientButton({
  clientId,
  clientFirstName,
  clientEmail,
  disabled,
}: {
  clientId: string;
  clientFirstName: string;
  clientEmail: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const close = () => {
    if (sending) return;
    setOpen(false);
    setFeedback(null);
  };

  const send = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? "Échec de l'envoi. Réessayez." });
        return;
      }
      setFeedback({ ok: true, text: `Courriel envoyé à ${clientEmail} ✓` });
      setSubject('');
      setMessage('');
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — vérifiez la connexion et réessayez.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Ce client n'a pas de vraie adresse courriel" : `Écrire à ${clientEmail}`}
        style={{
          padding: '10px 18px',
          borderRadius: '8px',
          border: '1px solid #6B3FA0',
          background: disabled ? '#E5E7EB' : 'linear-gradient(135deg, #6B3FA0, #4A2D7A)',
          color: disabled ? '#9CA3AF' : '#FFFFFF',
          fontFamily: 'var(--font-cinzel, serif)',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: disabled ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ✉ Envoyer un courriel
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Envoyer un courriel à ${clientFirstName}`}
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
                maxWidth: '560px',
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
                Envoyer un courriel à {clientFirstName}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 16px' }}>
                À : {clientEmail} — la réponse arrivera à info@runesetmagie.ca
              </p>

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Sujet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Ex. : Suivi de ta dernière séance"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.9rem',
                  color: '#111827',
                  marginBottom: '14px',
                  boxSizing: 'border-box',
                }}
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={10000}
                rows={8}
                placeholder={`Bonjour ${clientFirstName},\n\n…`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.9rem',
                  color: '#111827',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: '6px 0 0' }}>
                Le message sera habillé aux couleurs de Runes &amp; Magie (les sauts de ligne sont conservés).
              </p>

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
                  disabled={sending}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#4B5563',
                    fontSize: '0.85rem',
                    cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {feedback?.ok ? 'Fermer' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !subject.trim() || !message.trim()}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      sending || !subject.trim() || !message.trim()
                        ? '#C4B5FD'
                        : 'linear-gradient(135deg, #6B3FA0, #4A2D7A)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: sending || !subject.trim() || !message.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? 'Envoi en cours…' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
