'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [consentInfolettre, setConsentInfolettre] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (!consentTerms) {
      setError('Vous devez accepter les conditions générales pour créer un compte.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/holistique/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          consentInfolettre,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Une erreur est survenue lors de la création du compte.');
        return;
      }

      router.push('/soins/auth/login?registered=1');
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const inputBaseStyle: React.CSSProperties = {
    borderColor: 'rgba(74, 45, 122, 0.4)',
  };

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.5)';
    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(201, 168, 76, 0.2)';
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(74, 45, 122, 0.4)';
    e.currentTarget.style.boxShadow = 'none';
  }

  const fields: Array<{
    id: keyof FormData;
    label: string;
    type: string;
    autoComplete: string;
    placeholder: string;
    optional?: boolean;
  }> = [
    {
      id: 'firstName',
      label: 'Prénom',
      type: 'text',
      autoComplete: 'given-name',
      placeholder: 'Votre prénom',
    },
    {
      id: 'lastName',
      label: 'Nom',
      type: 'text',
      autoComplete: 'family-name',
      placeholder: 'Votre nom de famille',
    },
    {
      id: 'email',
      label: 'Courriel',
      type: 'email',
      autoComplete: 'email',
      placeholder: 'votre@courriel.ca',
    },
    {
      id: 'phone',
      label: 'Téléphone (optionnel)',
      type: 'tel',
      autoComplete: 'tel',
      placeholder: '(514) 555-1234',
      optional: true,
    },
    {
      id: 'password',
      label: 'Mot de passe',
      type: 'password',
      autoComplete: 'new-password',
      placeholder: 'Minimum 8 caractères',
    },
    {
      id: 'confirmPassword',
      label: 'Confirmer le mot de passe',
      type: 'password',
      autoComplete: 'new-password',
      placeholder: '••••••••',
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{
        background: 'linear-gradient(160deg, var(--charbon-mystere) 0%, var(--noir-nuit) 100%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* En-tête */}
        <div className="text-center mb-10">
          <div
            className="font-cinzel-decorative text-5xl mb-4 select-none"
            style={{ color: 'rgba(201, 168, 76, 0.5)' }}
            aria-hidden="true"
          >
            ᚠ
          </div>
          <h1
            className="font-cinzel-decorative text-2xl sm:text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Créer mon compte
          </h1>
          <p className="font-cormorant italic text-parchemin/50 text-lg">
            Commencez votre chemin de guérison holistique
          </p>
        </div>

        {/* Formulaire */}
        <div
          className="rounded-sm border p-8"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            borderColor: 'rgba(74, 45, 122, 0.4)',
            boxShadow: '0 0 40px rgba(45, 27, 78, 0.3)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Message d'erreur */}
            {error && (
              <div
                className="px-4 py-3 rounded-sm border text-sm font-philosopher"
                style={{
                  backgroundColor: 'rgba(196, 29, 110, 0.1)',
                  borderColor: 'rgba(196, 29, 110, 0.3)',
                  color: '#f87171',
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Prénom + Nom en grid */}
            <div className="grid grid-cols-2 gap-4">
              {fields.slice(0, 2).map((field) => (
                <div key={field.id} className="flex flex-col gap-2">
                  <label
                    htmlFor={field.id}
                    className="font-cinzel text-xs uppercase tracking-widest text-parchemin/60"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    value={formData[field.id]}
                    onChange={handleChange}
                    required
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-3 rounded-sm border bg-transparent font-philosopher text-parchemin placeholder:text-parchemin/25 focus:outline-none transition-colors duration-200"
                    style={inputBaseStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              ))}
            </div>

            {/* Courriel + tél + mots de passe */}
            {fields.slice(2).map((field) => (
              <div key={field.id} className="flex flex-col gap-2">
                <label
                  htmlFor={field.id}
                  className="font-cinzel text-xs uppercase tracking-widest text-parchemin/60"
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  value={formData[field.id]}
                  onChange={handleChange}
                  required={!field.optional}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-sm border bg-transparent font-philosopher text-parchemin placeholder:text-parchemin/25 focus:outline-none transition-colors duration-200"
                  style={inputBaseStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            ))}

            {/* Consentements */}
            <div className="space-y-3 pt-2 border-t border-violet-royal/20 mt-2">
              {/* Consentement infolettre — optionnel */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentInfolettre}
                  onChange={(e) => setConsentInfolettre(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-violet-royal flex-shrink-0"
                />
                <span className="font-philosopher text-xs leading-relaxed text-parchemin/70">
                  Je souhaite recevoir l&apos;infolettre de Runes &amp; Magie (lunaisons, ateliers,
                  offres exclusives). Je peux me désabonner à tout moment.
                </span>
              </label>

              {/* Consentement CGU/Loi 25 — obligatoire */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 accent-violet-royal flex-shrink-0"
                />
                <span className="font-philosopher text-xs leading-relaxed text-parchemin/70">
                  J&apos;accepte les conditions générales et la politique de confidentialité.
                  Mes données sont collectées conformément à la Loi 25 (Québec) et à la LCAP.
                  <span className="text-magenta-rituel"> *</span>
                </span>
              </label>

              {/* Mention légale */}
              <p className="text-[10px] text-parchemin/40 font-cormorant italic leading-relaxed pt-2">
                Responsable du traitement&nbsp;: Annabelle Dionne — Runes &amp; Magie,
                info@runesetmagie.com. Vos informations sont conservées de manière confidentielle.
                Aucune revente à des tiers.
              </p>
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center font-cinzel uppercase tracking-widest text-sm px-6 py-3.5 rounded-sm border transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
              style={{
                background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
                borderColor: 'rgba(201, 168, 76, 0.3)',
                color: 'var(--or-ancien)',
              }}
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Séparateur */}
          <div
            className="h-px my-6"
            style={{ background: 'linear-gradient(to right, transparent, rgba(74, 45, 122, 0.4), transparent)' }}
            aria-hidden="true"
          />

          {/* Lien de connexion */}
          <p className="text-center font-philosopher text-sm text-parchemin/40">
            Déjà un compte ?{' '}
            <Link
              href="/soins/auth/login"
              className="text-turquoise-cristal hover:text-or-ancien transition-colors duration-200 underline underline-offset-2"
            >
              Se connecter
            </Link>
          </p>
        </div>

        {/* Retour */}
        <p className="text-center mt-6">
          <Link
            href="/soins"
            className="font-philosopher text-xs text-parchemin/30 hover:text-parchemin/60 transition-colors duration-200"
          >
            ← Retour à la plateforme
          </Link>
        </p>
      </div>
    </div>
  );
}
