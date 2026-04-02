'use client';

import { useState } from 'react';
import Link from 'next/link';

const SPECIALTIES = [
  'Reiki',
  'Naturopathie',
  'Coaching Spirituel',
  'Cristallothérapie',
  'Hypnose',
  'Soins Chamaniques',
];

const YEARS_OPTIONS = [
  { value: 0, label: 'Moins d\'1 an' },
  { value: 1, label: '1 an' },
  { value: 2, label: '2 ans' },
  { value: 3, label: '3 ans' },
  { value: 5, label: '5 ans' },
  { value: 10, label: '10 ans' },
  { value: 15, label: '15 ans' },
  { value: 20, label: '20 ans +' },
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  specialties: string[];
  yearsExperience: number;
  hourlyRate: number;
  bio: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '2px',
  border: '1px solid rgba(74, 45, 122, 0.4)',
  background: 'var(--charbon-mystere)',
  color: 'var(--parchemin)',
  fontFamily: 'var(--font-cormorant)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-cinzel)',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(232, 220, 190, 0.6)',
  marginBottom: '6px',
  display: 'block',
};

function handleInputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.5)';
  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(201, 168, 76, 0.2)';
}

function handleInputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'rgba(74, 45, 122, 0.4)';
  e.currentTarget.style.boxShadow = 'none';
}

export default function InscriptionPraticienPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialties: [],
    yearsExperience: 3,
    hourlyRate: 80,
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleSpecialtyToggle(specialty: string) {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  }

  function validateStep1(): string | null {
    if (!form.firstName.trim()) return 'Le prénom est requis.';
    if (!form.lastName.trim()) return 'Le nom de famille est requis.';
    if (!form.email.trim() || !form.email.includes('@')) return 'Adresse courriel invalide.';
    if (form.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    return null;
  }

  function validateStep2(): string | null {
    if (form.specialties.length === 0) return 'Sélectionnez au moins une spécialité.';
    if (!form.bio.trim() || form.bio.trim().length < 50)
      return 'La biographie doit contenir au moins 50 caractères.';
    if (form.hourlyRate < 20 || form.hourlyRate > 500)
      return 'Le tarif horaire doit être entre 20 $ et 500 $.';
    return null;
  }

  function handleNext() {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setError(null);
    const err2 = validateStep2();
    if (err2) { setError(err2); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/holistique/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          isPractitioner: true,
          bio: form.bio,
          specialties: form.specialties,
          yearsExperience: form.yearsExperience,
          hourlyRate: form.hourlyRate,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Une erreur est survenue. Veuillez réessayer.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }

  // --- Step 3: Confirmation ---
  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--noir-nuit)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ maxWidth: '540px', width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: '4rem',
              color: 'rgba(201, 168, 76, 0.5)',
              marginBottom: '24px',
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            ᚠ
          </div>
          <div
            style={{
              background: 'var(--charbon-mystere)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '4px',
              padding: '40px 32px',
              boxShadow: '0 0 60px rgba(201, 168, 76, 0.08)',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-cinzel-decorative)',
                fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '20px',
              }}
            >
              Demande reçue
            </h1>
            <div
              style={{
                width: '48px',
                height: '1px',
                background: 'rgba(201, 168, 76, 0.3)',
                margin: '0 auto 20px',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.15rem',
                fontStyle: 'italic',
                color: 'var(--parchemin)',
                lineHeight: 1.8,
                marginBottom: '12px',
              }}
            >
              Votre demande est en cours d&apos;examen par notre équipe.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.05rem',
                color: 'rgba(232, 220, 190, 0.55)',
                lineHeight: 1.7,
                marginBottom: '32px',
              }}
            >
              Elle sera approuvée sous 48 heures ouvrables.
              Vous recevrez une notification par courriel dès que votre profil sera validé.
            </p>
            <Link
              href="/soins"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 36px',
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
                color: 'var(--or-ancien)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                borderRadius: '2px',
                textDecoration: 'none',
                transition: 'all 0.3s',
              }}
            >
              Retour à la plateforme
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir-nuit)' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 60%, var(--noir-nuit) 100%)',
          padding: '60px 24px 50px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: '3rem',
            color: 'rgba(201, 168, 76, 0.4)',
            marginBottom: '16px',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ᚷ
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
          }}
        >
          Devenir Praticien
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            color: 'rgba(232, 220, 190, 0.5)',
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.8,
          }}
        >
          Rejoignez notre communauté de guérisseurs et partagez vos dons sur la plateforme Runes &amp; Magie.
        </p>
      </section>

      {/* Progress bar */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {[
            { num: 1, label: 'Infos personnelles' },
            { num: 2, label: 'Profil professionnel' },
            { num: 3, label: 'Confirmation' },
          ].map((s, idx) => (
            <div
              key={s.num}
              style={{ display: 'flex', alignItems: 'center', flex: idx < 2 ? 1 : 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: `2px solid ${step >= s.num ? 'var(--or-ancien)' : 'rgba(74, 45, 122, 0.4)'}`,
                    background: step > s.num
                      ? 'rgba(201, 168, 76, 0.2)'
                      : step === s.num
                        ? 'rgba(201, 168, 76, 0.12)'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.85rem',
                    color: step >= s.num ? 'var(--or-ancien)' : 'rgba(232, 220, 190, 0.35)',
                    transition: 'all 0.3s',
                    flexShrink: 0,
                  }}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: step >= s.num ? 'var(--or-ancien)' : 'rgba(232, 220, 190, 0.3)',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.3s',
                  }}
                >
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: step > s.num
                      ? 'rgba(201, 168, 76, 0.5)'
                      : 'rgba(74, 45, 122, 0.3)',
                    margin: '0 8px',
                    marginBottom: '22px',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(196, 29, 110, 0.1)',
              border: '1px solid rgba(196, 29, 110, 0.35)',
              borderRadius: '4px',
              padding: '14px 20px',
              marginBottom: '24px',
              fontFamily: 'var(--font-cormorant)',
              color: '#f87171',
              fontSize: '1rem',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* STEP 1: Infos personnelles */}
        {step === 1 && (
          <div
            style={{
              background: 'var(--charbon-mystere)',
              border: '1px solid rgba(74, 45, 122, 0.4)',
              borderRadius: '4px',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--or-ancien)',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
              }}
            >
              Informations personnelles
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label htmlFor="firstName" style={labelStyle}>Prénom *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  placeholder="Votre prénom"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div>
                <label htmlFor="lastName" style={labelStyle}>Nom de famille *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  placeholder="Votre nom"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={labelStyle}>Courriel *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="votre@courriel.ca"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="phone" style={labelStyle}>Téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="+1 (514) 000-0000"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={labelStyle}>Mot de passe * (min. 8 caractères)</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirmer le mot de passe *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: '14px 40px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  background: 'linear-gradient(135deg, var(--or-ancien), #b8941f)',
                  color: 'var(--noir-nuit)',
                  border: '1px solid rgba(201, 168, 76, 0.5)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Profil professionnel */}
        {step === 2 && (
          <div
            style={{
              background: 'var(--charbon-mystere)',
              border: '1px solid rgba(74, 45, 122, 0.4)',
              borderRadius: '4px',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--or-ancien)',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
              }}
            >
              Profil professionnel
            </h2>

            {/* Spécialités */}
            <div style={{ marginBottom: '24px' }}>
              <p style={labelStyle}>Spécialités * (au moins une)</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap: '10px',
                }}
              >
                {SPECIALTIES.map((specialty) => {
                  const checked = form.specialties.includes(specialty);
                  return (
                    <label
                      key={specialty}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '10px 14px',
                        borderRadius: '2px',
                        border: `1px solid ${checked ? 'rgba(46, 196, 182, 0.5)' : 'rgba(74, 45, 122, 0.35)'}`,
                        background: checked ? 'rgba(46, 196, 182, 0.08)' : 'transparent',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        style={{
                          accentColor: 'var(--turquoise-cristal)',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-cinzel)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.05em',
                          color: checked ? 'var(--turquoise-cristal)' : 'var(--parchemin-vieilli)',
                          transition: 'color 0.2s',
                        }}
                      >
                        {specialty}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Années d'expérience */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="yearsExperience" style={labelStyle}>Années d&apos;expérience *</label>
              <select
                id="yearsExperience"
                name="yearsExperience"
                value={form.yearsExperience}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              >
                {YEARS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ background: 'var(--charbon-mystere)', color: 'var(--parchemin)' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tarif horaire */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="hourlyRate" style={labelStyle}>Tarif horaire ($ CAD) *</label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                value={form.hourlyRate}
                onChange={handleChange}
                required
                min={20}
                max={500}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="bio" style={labelStyle}>Biographie professionnelle * (min. 50 caractères)</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Décrivez votre parcours, vos formations, votre approche thérapeutique et ce qui vous a amené à la pratique des soins holistiques..."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '130px',
                  lineHeight: 1.7,
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.85rem',
                  color: 'rgba(232, 220, 190, 0.3)',
                  marginTop: '6px',
                  textAlign: 'right',
                }}
              >
                {form.bio.trim().length} caractères
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: '14px 32px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  background: 'transparent',
                  color: 'rgba(232, 220, 190, 0.5)',
                  border: '1px solid rgba(74, 45, 122, 0.4)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: '14px 40px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  background: 'linear-gradient(135deg, var(--or-ancien), #b8941f)',
                  color: 'var(--noir-nuit)',
                  border: '1px solid rgba(201, 168, 76, 0.5)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Récapitulatif + Soumettre */}
        {step === 3 && (
          <div
            style={{
              background: 'var(--charbon-mystere)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '4px',
              padding: '32px',
              boxShadow: '0 0 40px rgba(201, 168, 76, 0.05)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--or-ancien)',
                marginBottom: '28px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
              }}
            >
              Confirmation de la demande
            </h2>

            {/* Récap */}
            <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
              {[
                { label: 'Nom', value: `${form.firstName} ${form.lastName}` },
                { label: 'Courriel', value: form.email },
                ...(form.phone ? [{ label: 'Téléphone', value: form.phone }] : []),
                { label: 'Spécialités', value: form.specialties.join(', ') || '—' },
                {
                  label: 'Expérience',
                  value: YEARS_OPTIONS.find((o) => o.value === form.yearsExperience)?.label ?? `${form.yearsExperience} ans`,
                },
                { label: 'Tarif horaire', value: `${form.hourlyRate} $ / heure` },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(74, 45, 122, 0.2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(232, 220, 190, 0.4)',
                      flexShrink: 0,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '1rem',
                      color: 'var(--parchemin)',
                      textAlign: 'right',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Message info */}
            <div
              style={{
                background: 'rgba(46, 196, 182, 0.06)',
                border: '1px solid rgba(46, 196, 182, 0.25)',
                borderRadius: '4px',
                padding: '16px 20px',
                marginBottom: '28px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.05rem',
                  fontStyle: 'italic',
                  color: 'rgba(232, 220, 190, 0.65)',
                  lineHeight: 1.8,
                }}
              >
                En soumettant cette demande, votre profil sera examiné par notre équipe.
                Vous recevrez une réponse par courriel sous 48 heures ouvrables.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                style={{
                  padding: '14px 32px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  background: 'transparent',
                  color: 'rgba(232, 220, 190, 0.5)',
                  border: '1px solid rgba(74, 45, 122, 0.4)',
                  borderRadius: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.3s',
                }}
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '14px 40px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  background: loading
                    ? 'rgba(201, 168, 76, 0.3)'
                    : 'linear-gradient(135deg, var(--or-ancien), #b8941f)',
                  color: 'var(--noir-nuit)',
                  border: '1px solid rgba(201, 168, 76, 0.5)',
                  borderRadius: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s',
                }}
              >
                {loading ? 'Soumission...' : 'Soumettre ma candidature'}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '60px' }}>
          <Link
            href="/soins"
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(232, 220, 190, 0.25)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            ← Retour à la plateforme
          </Link>
        </div>
      </div>
    </div>
  );
}
