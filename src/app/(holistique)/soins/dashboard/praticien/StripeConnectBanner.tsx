'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';

interface Props {
  stripeAccountReady: boolean;
  hasStripeAccount: boolean;
}

export default function StripeConnectBanner({ stripeAccountReady, hasStripeAccount }: Props) {
  const searchParams = useSearchParams();
  const stripeStatus = searchParams.get('stripe'); // 'ok' | 'incomplete' | 'refresh' | 'error' | null
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function startOnboarding() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/holistique/stripe/connect/onboard', { method: 'POST' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Erreur lors de la création du compte Stripe.');
          return;
        }
        const { url } = await res.json();
        if (url) window.location.href = url;
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  // Cas 1 : tout est en règle → bandeau vert minimal
  if (stripeAccountReady) {
    return (
      <div
        style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: '8px',
          padding: '14px 20px',
          marginTop: '16px',
          fontFamily: 'var(--font-cormorant)',
          color: 'var(--parchemin)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ color: '#4ade80', fontSize: '1.3rem' }}>✓</span>
        <div>
          <p style={{ fontFamily: 'var(--font-cinzel)', color: '#4ade80', fontSize: '0.8rem', letterSpacing: '0.08em', margin: '0 0 2px' }}>
            Compte Stripe Connect actif
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
            Tu recevras 65 % de chaque paiement directement sur ton compte bancaire, 24 h après la séance.
          </p>
        </div>
      </div>
    );
  }

  // Cas 2 : pas de compte OU compte incomplet → CTA pour configurer
  const isIncomplete = hasStripeAccount;
  const statusMessage = (() => {
    if (stripeStatus === 'incomplete') return 'Onboarding Stripe incomplet — il manque encore des infos.';
    if (stripeStatus === 'refresh') return 'Le lien Stripe a expiré, relance la configuration.';
    if (stripeStatus === 'error') return 'Une erreur est survenue, réessaie.';
    if (stripeStatus === 'ok' && !stripeAccountReady) return 'Compte créé mais pas encore complètement vérifié par Stripe. Vérifie tes emails.';
    return null;
  })();

  return (
    <div
      style={{
        background: 'rgba(201, 168, 76, 0.08)',
        border: '1px solid rgba(201, 168, 76, 0.4)',
        borderRadius: '8px',
        padding: '20px 24px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            ⚡ Configure ton compte Stripe pour recevoir tes paiements
          </p>
          <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.8, fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            Stripe est notre partenaire de paiement sécurisé. {isIncomplete ? 'Termine la configuration de ton compte' : 'Crée ton compte Stripe Express'} pour que les paiements clients soient versés <strong>automatiquement sur ton compte bancaire</strong> (65 %, le reste = commission Runes &amp; Magie 35 %). Stripe te demandera ton numéro d&apos;assurance sociale, infos bancaires et pièce d&apos;identité. ~5 min.
          </p>
          {statusMessage && (
            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: stripeStatus === 'ok' ? '#4ade80' : '#fbbf24', fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
              {statusMessage}
            </p>
          )}
          {error && (
            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#f87171', fontFamily: 'var(--font-cormorant)' }}>
              {error}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={startOnboarding}
          disabled={pending}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
            border: '1px solid var(--or-ancien)',
            color: 'var(--or-ancien)',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            cursor: pending ? 'wait' : 'pointer',
            opacity: pending ? 0.6 : 1,
            alignSelf: 'center',
          }}
        >
          {pending ? 'Chargement…' : (isIncomplete ? 'Continuer la configuration' : 'Configurer Stripe')}
        </button>
      </div>
    </div>
  );
}
