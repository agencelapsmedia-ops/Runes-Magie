'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestProfileChange } from '@/app/admin/praticiens/modifications/actions';
import { uploadImage } from '@/lib/supabase';

interface ProfileDefaults {
  firstName: string;
  lastName: string;
  bio: string;
  specialties: string[];
  yearsExperience: number;
  hourlyRate: number;
  photoUrl: string | null;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-cinzel)',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--or-ancien)',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(26, 26, 46, 0.6)',
  border: '1px solid rgba(74, 45, 122, 0.5)',
  borderRadius: '4px',
  color: 'var(--parchemin)',
  fontFamily: 'var(--font-philosopher)',
  fontSize: '1rem',
};

export default function ProfileEditor({ defaults }: { defaults: ProfileDefaults }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState(defaults.firstName);
  const [lastName, setLastName] = useState(defaults.lastName);
  const [bio, setBio] = useState(defaults.bio);
  const [specialties, setSpecialties] = useState(defaults.specialties.join(', '));
  const [yearsExperience, setYearsExperience] = useState(defaults.yearsExperience);
  const [sessionPrice, setSessionPrice] = useState(
    Math.round(defaults.hourlyRate * 1.5 * 100) / 100,
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaults.photoUrl);
  const [uploading, setUploading] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, 'praticiens');
      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const newHourlyRate = sessionPrice > 0 ? sessionPrice / 1.5 : defaults.hourlyRate;

    // On envoie SEULEMENT les champs qui ont changé (réduit les approbations inutiles)
    const payload: Record<string, unknown> = {};
    if (firstName.trim() !== defaults.firstName) payload.firstName = firstName.trim();
    if (lastName.trim() !== defaults.lastName) payload.lastName = lastName.trim();
    if (bio.trim() !== defaults.bio) payload.bio = bio.trim();
    const newSpecialties = specialties.split(',').map((s) => s.trim()).filter(Boolean);
    if (JSON.stringify(newSpecialties) !== JSON.stringify(defaults.specialties)) {
      payload.specialties = newSpecialties;
    }
    if (yearsExperience !== defaults.yearsExperience) payload.yearsExperience = yearsExperience;
    if (Math.abs(newHourlyRate - defaults.hourlyRate) > 0.01) payload.hourlyRate = newHourlyRate;
    if (photoUrl !== defaults.photoUrl) payload.photoUrl = photoUrl;

    if (Object.keys(payload).length === 0) {
      setError('Aucune modification détectée.');
      return;
    }

    startTransition(async () => {
      try {
        await requestProfileChange(payload);
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(26, 26, 46, 0.85)',
        border: '1px solid rgba(74, 45, 122, 0.4)',
        borderRadius: '8px',
        padding: '32px',
        display: 'grid',
        gap: '24px',
      }}
    >
      {success && (
        <div
          style={{
            background: 'rgba(46, 196, 182, 0.1)',
            border: '1px solid rgba(46, 196, 182, 0.4)',
            borderRadius: '6px',
            padding: '12px 16px',
            color: 'var(--turquoise-cristal)',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1rem',
          }}
        >
          ✓ Demande envoyée à Runes &amp; Magie pour approbation.
        </div>
      )}
      {error && (
        <div
          style={{
            background: 'rgba(196, 29, 110, 0.1)',
            border: '1px solid rgba(196, 29, 110, 0.4)',
            borderRadius: '6px',
            padding: '12px 16px',
            color: '#f87171',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Photo */}
      <div>
        <label style={labelStyle}>Photo de profil</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Photo de profil"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--or-ancien)',
              }}
            />
          ) : (
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(74, 45, 122, 0.3)',
                border: '2px dashed var(--or-ancien)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--or-ancien)',
                fontSize: '2rem',
                fontFamily: 'var(--font-cinzel)',
              }}
            >
              ᚻ
            </div>
          )}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={uploading || pending}
              style={{ ...inputStyle, padding: '8px' }}
            />
            {uploading && (
              <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--turquoise-cristal)', fontSize: '0.9rem', marginTop: '6px' }}>
                ⏳ Upload en cours...
              </p>
            )}
            {photoUrl && photoUrl !== defaults.photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(defaults.photoUrl)}
                style={{
                  marginTop: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(196, 29, 110, 0.4)',
                  color: '#f87171',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Annuler le changement de photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="firstName">Prénom</label>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="lastName">Nom</label>
          <input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle} htmlFor="bio">Biographie</label>
        <textarea
          id="bio"
          rows={8}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', lineHeight: 1.6 }}
        />
      </div>

      {/* Spécialités */}
      <div>
        <label style={labelStyle} htmlFor="specialties">Spécialités</label>
        <input
          id="specialties"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          style={inputStyle}
          placeholder="Reiki, Cristallothérapie, Coaching Spirituel"
        />
        <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)/50', fontSize: '0.85rem', marginTop: '4px' }}>
          Séparées par des virgules.
        </p>
      </div>

      {/* Expérience + tarif */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="yearsExperience">Années d&apos;expérience</label>
          <input
            id="yearsExperience"
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="sessionPrice">Prix par séance (90 min) — $ CAD</label>
          <input
            id="sessionPrice"
            type="number"
            step="0.01"
            min={0}
            value={sessionPrice}
            onChange={(e) => setSessionPrice(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ borderTop: '1px solid rgba(74, 45, 122, 0.4)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={pending || uploading}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
            border: '1px solid var(--or-ancien)',
            color: 'var(--or-ancien)',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            cursor: pending || uploading ? 'not-allowed' : 'pointer',
            opacity: pending || uploading ? 0.6 : 1,
          }}
        >
          {pending ? 'Envoi en cours...' : 'Soumettre pour approbation'}
        </button>
      </div>
    </form>
  );
}
