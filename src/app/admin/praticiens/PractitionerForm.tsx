/* Formulaire partagé pour création / modification d'un praticien.
   Utilisé par /admin/praticiens/nouveau et /admin/praticiens/[id]/edit. */

import PhotoSection from './PhotoSection';

interface PractitionerFormProps {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  /** Si true, affiche le champ « Nouveau mot de passe » (mode édition uniquement). */
  showPasswordField?: boolean;
  defaults?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    specialties?: string[];
    yearsExperience?: number;
    hourlyRate?: number;
    photoUrl?: string | null;
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  color: '#1F2937', // texte sombre lisible sur fond clair
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

export default function PractitionerForm({
  action,
  cancelHref,
  submitLabel,
  showPasswordField = false,
  defaults = {},
}: PractitionerFormProps) {
  const sessionPrice =
    defaults.hourlyRate !== undefined
      ? Math.round(defaults.hourlyRate * 1.5 * 100) / 100
      : '';

  return (
    <form
      action={action}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '32px',
        display: 'grid',
        gap: '20px',
        maxWidth: '720px',
      }}
    >
      {/* Identité */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="firstName">Prénom *</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            defaultValue={defaults.firstName ?? ''}
            style={inputStyle}
            placeholder="Ex: Noctura"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="lastName">Nom (optionnel)</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={defaults.lastName ?? ''}
            style={inputStyle}
            placeholder="Laisser vide pour mononyme"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="email">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaults.email ?? ''}
          style={inputStyle}
          placeholder="praticien@runesetmagie.ca"
        />
      </div>

      {/* Bio */}
      <div>
        <label style={labelStyle} htmlFor="bio">Biographie</label>
        <textarea
          id="bio"
          name="bio"
          rows={6}
          defaultValue={defaults.bio ?? ''}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Présentez le parcours et l'approche du praticien…"
        />
      </div>

      {/* Spécialités */}
      <div>
        <label style={labelStyle} htmlFor="specialties">Spécialités</label>
        <input
          id="specialties"
          name="specialties"
          type="text"
          defaultValue={(defaults.specialties ?? []).join(', ')}
          style={inputStyle}
          placeholder="Reiki, Cristallothérapie, Coaching Spirituel"
        />
        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
          Séparées par des virgules. Affiché en badges sur la fiche publique.
        </p>
      </div>

      {/* Chiffres */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="yearsExperience">Années d&apos;expérience</label>
          <input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            defaultValue={defaults.yearsExperience ?? 0}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="sessionPrice">Prix par séance (90 min) — $ CAD *</label>
          <input
            id="sessionPrice"
            name="sessionPrice"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={sessionPrice}
            style={inputStyle}
            placeholder="129.99"
          />
        </div>
      </div>

      {/* Photo — gérée par client component (preview, upload, suppression) */}
      <PhotoSection currentPhotoUrl={defaults.photoUrl ?? null} />

      {/* Mot de passe (édition uniquement) */}
      {showPasswordField && (
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
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            style={inputStyle}
            placeholder="Laisser vide pour ne pas changer"
          />
          <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
            Si rempli, remplace le mot de passe actuel du praticien (minimum 8 caractères).
            <br />
            <strong>À transmettre manuellement au praticien.</strong> Aucun email n&apos;est envoyé.
          </p>
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
        <a
          href={cancelHref}
          style={{
            padding: '10px 20px',
            background: '#F3F4F6',
            color: '#374151',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
          }}
        >
          Annuler
        </a>
        <button
          type="submit"
          style={{
            padding: '10px 24px',
            background: '#6B3FA0',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-cinzel, serif)',
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
