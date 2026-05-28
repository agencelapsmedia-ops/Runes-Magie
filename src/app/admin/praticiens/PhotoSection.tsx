'use client';

import { useState } from 'react';

interface Props {
  currentPhotoUrl: string | null;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
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

export default function PhotoSection({ currentPhotoUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [removed, setRemoved] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      // Si pas de fichier choisi, on revient à la photo actuelle (sauf si supprimée)
      setPreview(removed ? null : currentPhotoUrl);
      return;
    }
    setFileName(file.name);
    setRemoved(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    if (!confirm('Supprimer la photo de profil ? Le praticien apparaîtra avec ses initiales jusqu\'à ce qu\'une nouvelle photo soit ajoutée.')) {
      return;
    }
    setRemoved(true);
    setPreview(null);
    setFileName(null);
    // Réinitialise l'input fichier
    const fileInput = document.querySelector<HTMLInputElement>('input[name="photoFile"]');
    if (fileInput) fileInput.value = '';
    // Réinitialise le champ URL
    const urlInput = document.querySelector<HTMLInputElement>('input[name="photoUrlText"]');
    if (urlInput) urlInput.value = '';
  }

  return (
    <div>
      <label style={labelStyle}>Photo de profil</label>

      {/* Preview + bouton supprimer */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Photo de profil"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #C4B5FD',
              boxShadow: '0 2px 8px rgba(107, 63, 160, 0.15)',
            }}
          />
        ) : (
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#EDE9FE',
              border: '3px dashed #C4B5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B3FA0',
              fontSize: '2rem',
              fontFamily: 'var(--font-cinzel, serif)',
            }}
          >
            ᚻ
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
            {fileName
              ? `Nouvelle photo : ${fileName}`
              : removed
              ? 'La photo sera supprimée à l\'enregistrement'
              : preview
              ? 'Photo actuelle'
              : 'Aucune photo'}
          </span>
          {(preview || removed === false && currentPhotoUrl) && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                padding: '6px 14px',
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-cinzel, serif)',
                alignSelf: 'flex-start',
              }}
            >
              Supprimer la photo
            </button>
          )}
        </div>
      </div>

      {/* Upload fichier */}
      <input
        name="photoFile"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ ...inputStyle, padding: '8px' }}
      />
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
        Choisis un fichier (JPG, PNG, WebP) — uploadé sur Supabase Storage.
      </p>

      {/* URL texte alternative */}
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '12px', marginBottom: '4px' }}>
        OU colle une URL d&apos;image existante :
      </p>
      <input
        name="photoUrlText"
        type="text"
        defaultValue={currentPhotoUrl ?? ''}
        style={inputStyle}
        placeholder="https://… ou /images/praticiens/foo.jpg"
      />

      {/* Hidden input pour signaler au server action qu'on veut supprimer */}
      {removed && <input type="hidden" name="deletePhoto" value="1" />}
    </div>
  );
}
