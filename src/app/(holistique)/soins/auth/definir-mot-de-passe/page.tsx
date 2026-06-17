'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function DefinirMotDePasseForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    setPending(true);
    try {
      const res = await fetch('/api/holistique/auth/definir-mot-de-passe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Échec. Réessaie.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/soins/auth/login'), 1800);
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setPending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: '6px',
    borderRadius: '4px',
    border: '1px solid rgba(201,168,76,0.3)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--parchemin)',
    fontSize: '1rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir-nuit)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--charbon-mystere)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '40px 32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.4rem', color: 'var(--or-ancien)', marginBottom: '24px', textAlign: 'center' }}>
          Définir mon mot de passe
        </h1>
        {done ? (
          <p style={{ color: 'var(--turquoise-cristal)', textAlign: 'center', fontSize: '1rem' }}>
            ✓ Mot de passe enregistré. Redirection vers la connexion…
          </p>
        ) : !token ? (
          <p style={{ color: '#f87171', textAlign: 'center' }}>Lien invalide : jeton manquant.</p>
        ) : (
          <form onSubmit={submit}>
            <label style={{ display: 'block', color: 'rgba(232,220,190,0.7)', fontSize: '0.85rem' }}>
              Nouveau mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>
            <label style={{ display: 'block', color: 'rgba(232,220,190,0.7)', fontSize: '0.85rem', marginTop: '16px' }}>
              Confirmer le mot de passe
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>
            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
            <button
              type="submit"
              disabled={pending}
              style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'linear-gradient(135deg,#4A2D7A,#2D1B4E)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '4px', fontSize: '0.9rem', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}
            >
              {pending ? '…' : 'Activer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DefinirMotDePassePage() {
  return (
    <Suspense fallback={null}>
      <DefinirMotDePasseForm />
    </Suspense>
  );
}
