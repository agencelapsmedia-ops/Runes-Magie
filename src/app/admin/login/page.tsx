'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou mot de passe invalide.');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2D1B4E 50%, #0D5C54 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-or-ancien text-4xl select-none">&#10022;</span>
          <h1 className="mt-3 font-cinzel-decorative text-2xl font-bold text-gradient-gold">
            Runes &amp; Magie
          </h1>
          <p className="mt-1 text-sm text-parchemin-vieilli/60 font-philosopher">
            Connexion a l&apos;administration
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-charbon-mystere/90 backdrop-blur-md rounded-xl border border-violet-royal/40 p-6 space-y-5 shadow-[0_0_30px_rgba(107,63,160,0.2)]"
        >
          {error && (
            <div className="bg-magenta-rituel/10 border border-magenta-rituel/30 text-magenta-rituel text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-cinzel text-or-ancien/80 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-noir-nuit/60 border border-violet-royal/30 rounded-lg text-sm text-parchemin placeholder-parchemin-vieilli/30 focus:outline-none focus:ring-2 focus:ring-or-ancien/50 focus:border-or-ancien/50"
              placeholder="sorciere@runesetmagie.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-cinzel text-or-ancien/80 mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-noir-nuit/60 border border-violet-royal/30 rounded-lg text-sm text-parchemin placeholder-parchemin-vieilli/30 focus:outline-none focus:ring-2 focus:ring-or-ancien/50 focus:border-or-ancien/50"
              placeholder="Votre mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-royal hover:bg-violet-mystique text-parchemin font-cinzel font-medium py-2.5 rounded-lg text-sm tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(107,63,160,0.4)]"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
