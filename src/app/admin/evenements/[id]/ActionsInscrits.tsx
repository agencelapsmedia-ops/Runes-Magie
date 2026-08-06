'use client';

import { useState } from 'react';

interface Props {
  evenementId: string;
  /** true si l'événement est déjà annulé — masque le bouton « Annuler ». */
  dejaAnnule: boolean;
  /** Appelé après une annulation réussie, pour rafraîchir la fiche. */
  onAnnule: () => void;
}

const boutonStyle: React.CSSProperties = {
  padding: '9px 16px',
  background: '#fff',
  border: '1px solid #C4B5FD',
  color: '#6B3FA0',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  marginTop: '4px',
  borderRadius: '6px',
  border: '1px solid #D1D5DB',
  background: '#fff',
  color: '#1F2937',
  fontSize: '0.9rem',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: '#4B5563', fontWeight: 600, marginBottom: '14px' };

/** Modale en `<div>` fixe — jamais `confirm()`/`alert()`. */
function Modale({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' }}
      onClick={onFermer}
    >
      <div style={{ background: '#fff', borderRadius: '12px', padding: '26px', width: '100%', maxWidth: '480px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.2rem', color: '#2D1B4E', margin: '0 0 18px' }}>{titre}</h2>
        {children}
      </div>
    </div>
  );
}

export default function ActionsInscrits({ evenementId, dejaAnnule, onAnnule }: Props) {
  const [modale, setModale] = useState<'message' | 'annuler' | null>(null);
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function fermer() {
    setModale(null);
    setError(null);
  }

  async function envoyerMessage() {
    if (!sujet.trim()) return setError('Le sujet est requis.');
    if (!message.trim()) return setError('Le message est requis.');
    setEnvoi(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/evenements/${evenementId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet: sujet.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      const envoyesA = typeof data.envoyesA === 'number' ? data.envoyesA : 0;
      const echecs = typeof data.echecs === 'number' ? data.echecs : 0;
      setConfirmation(
        echecs > 0
          ? `Message envoyé à ${envoyesA} inscrit${envoyesA > 1 ? 's' : ''} — échec pour ${echecs} adresse${echecs > 1 ? 's' : ''}.`
          : `Message envoyé à ${envoyesA} inscrit${envoyesA > 1 ? 's' : ''}.`,
      );
      setSujet('');
      setMessage('');
      setModale(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setEnvoi(false);
    }
  }

  async function annulerEvenement() {
    setEnvoi(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/evenements/${evenementId}/annuler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motif: motif.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de l'annulation.");
      setModale(null);
      setMotif('');
      const envoyesA = typeof data.envoyesA === 'number' ? data.envoyesA : 0;
      const echecs = typeof data.echecs === 'number' ? data.echecs : 0;
      setConfirmation(
        echecs > 0
          ? `Événement annulé. ${envoyesA} inscrit${envoyesA > 1 ? 's' : ''} prévenu${envoyesA > 1 ? 's' : ''} — échec pour ${echecs} adresse${echecs > 1 ? 's' : ''} (à contacter manuellement).`
          : `Événement annulé. ${envoyesA} inscrit${envoyesA > 1 ? 's' : ''} prévenu${envoyesA > 1 ? 's' : ''}.`,
      );
      onAnnule();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <a href={`/api/admin/evenements/${evenementId}/inscrits?format=csv`} style={boutonStyle}>
          ⭳ Exporter en CSV
        </a>
        <button type="button" onClick={() => setModale('message')} style={{ ...boutonStyle, cursor: 'pointer' }}>
          ✉ Écrire à tous les inscrits
        </button>
        {!dejaAnnule && (
          <button
            type="button"
            onClick={() => setModale('annuler')}
            style={{ ...boutonStyle, cursor: 'pointer', color: '#991B1B', border: '1px solid #FCA5A5' }}
          >
            ⚠ Annuler l&apos;événement
          </button>
        )}
      </div>

      {confirmation && <p style={{ color: '#065F46', fontSize: '0.85rem', marginBottom: '14px' }}>{confirmation}</p>}

      {modale === 'message' && (
        <Modale titre="Écrire à tous les inscrits" onFermer={fermer}>
          <label style={labelStyle}>
            Sujet
            <input value={sujet} onChange={(e) => setSujet(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          {error && <p style={{ color: '#DC2626', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" onClick={fermer} disabled={envoi} style={{ padding: '9px 16px', background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="button" onClick={envoyerMessage} disabled={envoi} style={{ padding: '9px 18px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: envoi ? 0.6 : 1 }}>
              {envoi ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </Modale>
      )}

      {modale === 'annuler' && (
        <Modale titre="Annuler l'événement" onFermer={fermer}>
          <p style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '14px' }}>
            Tous les inscrits confirmés seront prévenus par courriel. Cette action ne peut pas être annulée depuis cette page.
          </p>
          <label style={labelStyle}>
            Motif (optionnel)
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          {error && <p style={{ color: '#DC2626', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" onClick={fermer} disabled={envoi} style={{ padding: '9px 16px', background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              Retour
            </button>
            <button
              type="button"
              onClick={annulerEvenement}
              disabled={envoi}
              style={{ padding: '9px 18px', background: '#991B1B', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: envoi ? 0.6 : 1 }}
            >
              {envoi ? 'Annulation…' : "Confirmer l'annulation"}
            </button>
          </div>
        </Modale>
      )}
    </>
  );
}
