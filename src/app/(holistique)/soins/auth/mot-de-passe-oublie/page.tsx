'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * « Mot de passe oublié » — demande du lien de réinitialisation.
 *
 * L'écran de succès est le même que l'adresse existe ou non : l'API ne révèle
 * jamais qui possède un compte, et la page ne doit pas le trahir non plus.
 */
export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch('/api/holistique/auth/mot-de-passe-oublie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErreur(j.error ?? 'Échec de la demande. Réessaie.');
        return;
      }
      setEnvoye(true);
    } catch {
      setErreur('Impossible de joindre le serveur.');
    } finally {
      setEnCours(false);
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
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ background: 'var(--charbon-mystere)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '40px 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.4rem', color: 'var(--or-ancien)', marginBottom: '10px', textAlign: 'center' }}>
            Mot de passe oublié
          </h1>

          {envoye ? (
            <>
              <p style={{ color: 'var(--turquoise-cristal)', textAlign: 'center', fontSize: '1rem', lineHeight: 1.6, marginTop: '18px' }}>
                ✓ Si un compte existe pour cette adresse, un lien vient d&apos;y être envoyé.
              </p>
              <p style={{ color: 'rgba(232,220,190,0.6)', textAlign: 'center', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '14px' }}>
                Vérifie aussi tes indésirables. Le lien est valide 7 jours et ne fonctionne qu&apos;une seule fois.
              </p>
            </>
          ) : (
            <form onSubmit={soumettre}>
              <p style={{ color: 'rgba(232,220,190,0.7)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 22px', textAlign: 'center' }}>
                Indique ton courriel : nous t&apos;enverrons un lien pour choisir un nouveau mot de passe.
              </p>
              <label style={{ display: 'block', color: 'rgba(232,220,190,0.7)', fontSize: '0.85rem' }}>
                Courriel
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  autoComplete="email"
                  autoFocus
                />
              </label>
              {erreur && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '12px' }}>{erreur}</p>}
              <button
                type="submit"
                disabled={enCours}
                style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'linear-gradient(135deg,#4A2D7A,#2D1B4E)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '4px', fontSize: '0.9rem', cursor: enCours ? 'default' : 'pointer', opacity: enCours ? 0.6 : 1 }}
              >
                {enCours ? 'Envoi…' : 'Recevoir le lien'}
              </button>
            </form>
          )}

          <div className="h-px my-6" style={{ background: 'linear-gradient(to right, transparent, rgba(74, 45, 122, 0.4), transparent)' }} aria-hidden="true" />

          <p className="text-center font-philosopher text-sm text-parchemin/40">
            <Link href="/soins/auth/login" className="text-turquoise-cristal hover:text-or-ancien transition-colors duration-200 underline underline-offset-2">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
