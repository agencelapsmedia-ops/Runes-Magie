'use client';

import { useState } from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 44px 10px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  color: '#1F2937',
  background: '#FFFFFF',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
  fontFamily: 'var(--font-cinzel, serif)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function PasswordField() {
  const [shown, setShown] = useState(false);

  return (
    <div
      style={{
        borderTop: '1px dashed #E5E7EB',
        paddingTop: '20px',
        marginTop: '8px',
      }}
    >
      <label style={labelStyle} htmlFor="newPassword">
        Nouveau mot de passe (optionnel)
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id="newPassword"
          name="newPassword"
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          minLength={8}
          style={inputStyle}
          placeholder="Laisser vide pour ne pas changer"
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
            color: '#6B3FA0',
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          {shown ? 'Masquer' : 'Voir'}
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
        Si rempli, remplace le mot de passe actuel du praticien (minimum 8 caractères).
        <br />
        <strong>À transmettre manuellement au praticien.</strong> Aucun email n&apos;est envoyé.
      </p>
    </div>
  );
}
