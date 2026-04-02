'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/soins/dashboard/client',
      });

      if (result?.error) {
        setError('Courriel ou mot de passe incorrect. Vérifiez vos informations et réessayez.');
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError('Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

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
            ᚨ
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
            Espace Holistique
          </h1>
          <p className="font-cormorant italic text-parchemin/50 text-lg">
            Reconnectez-vous à votre chemin de guérison
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

            {/* Courriel */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-cinzel text-xs uppercase tracking-widest text-parchemin/60"
              >
                Courriel
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="votre@courriel.ca"
                className="w-full px-4 py-3 rounded-sm border bg-transparent font-philosopher text-parchemin placeholder:text-parchemin/25 focus:outline-none transition-colors duration-200"
                style={{
                  borderColor: 'rgba(74, 45, 122, 0.4)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(201, 168, 76, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74, 45, 122, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="font-cinzel text-xs uppercase tracking-widest text-parchemin/60"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-sm border bg-transparent font-philosopher text-parchemin placeholder:text-parchemin/25 focus:outline-none transition-colors duration-200"
                style={{
                  borderColor: 'rgba(74, 45, 122, 0.4)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(201, 168, 76, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74, 45, 122, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Bouton de connexion */}
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Séparateur */}
          <div
            className="h-px my-6"
            style={{ background: 'linear-gradient(to right, transparent, rgba(74, 45, 122, 0.4), transparent)' }}
            aria-hidden="true"
          />

          {/* Lien d'inscription */}
          <p className="text-center font-philosopher text-sm text-parchemin/40">
            Pas encore de compte ?{' '}
            <Link
              href="/soins/auth/register"
              className="text-turquoise-cristal hover:text-or-ancien transition-colors duration-200 underline underline-offset-2"
            >
              S&apos;inscrire
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
