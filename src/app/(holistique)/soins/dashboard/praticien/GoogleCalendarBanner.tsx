'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';

interface Props {
  connected: boolean;
  googleEmail: string | null;
  /**
   * Cause du dernier refus de Google, ou null si le lien est sain. Distingue
   * « connectée » de « connectée un jour, mais Google n'en veut plus » — un
   * jeton expiré reste en base, et le bandeau affichait « connecté » pendant
   * que plus rien ne se synchronisait.
   */
  syncError?: string | null;
}

export default function GoogleCalendarBanner({ connected, googleEmail, syncError }: Props) {
  const searchParams = useSearchParams();
  const googleStatus = searchParams.get('google'); // 'connected' | 'error' | 'denied' | null
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();

  function resync() {
    setSyncMsg(null);
    setError(null);
    startSync(async () => {
      try {
        const res = await fetch('/api/holistique/auth/google/sync', { method: 'POST' });
        if (!res.ok) {
          setError('Échec de la synchronisation.');
          return;
        }
        const data = (await res.json()) as { synced: number; total: number };
        setSyncMsg(
          data.total === 0
            ? 'Ton agenda est déjà à jour ✓'
            : `${data.synced} rendez-vous synchronisé${data.synced > 1 ? 's' : ''} ✓`,
        );
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  function disconnect() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/holistique/auth/google/disconnect', { method: 'POST' });
        if (!res.ok) {
          setError('Impossible de déconnecter Google Agenda.');
          return;
        }
        window.location.href = '/soins/dashboard/praticien';
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  // Connectée, mais Google refuse le jeton → alerte franche.
  // C'est l'état qui manquait : pendant trois semaines, des rendez-vous ont
  // été pris sans jamais rejoindre l'agenda, et rien ne le signalait.
  if (connected && syncError) {
    return (
      <div
        role="alert"
        style={{
          background: 'rgba(196, 29, 110, 0.10)',
          border: '1px solid rgba(196, 29, 110, 0.5)',
          borderRadius: '8px',
          padding: '18px 22px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }} aria-hidden>
          ⚠️
        </span>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              color: '#f87171',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}
          >
            Ton Google Agenda n&apos;est plus relié
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              lineHeight: 1.55,
              fontFamily: 'var(--font-cormorant)',
              color: 'var(--parchemin)',
              opacity: 0.85,
            }}
          >
            {syncError}{' '}
            <strong style={{ color: '#f87171' }}>
              Tes rendez-vous confirmés ne s&apos;ajoutent plus à ton agenda
            </strong>{' '}
            et tes événements personnels ne bloquent plus tes disponibilités.
            {googleEmail ? ` Compte concerné : ${googleEmail}.` : ''}
          </p>
          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              fontSize: '0.9rem',
              fontStyle: 'italic',
              fontFamily: 'var(--font-cormorant)',
              color: 'var(--parchemin)',
              opacity: 0.6,
            }}
          >
            Reconnecte-toi : les rendez-vous à venir déjà confirmés seront
            replacés dans ton agenda automatiquement.
          </p>
          {error && (
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#f87171', fontFamily: 'var(--font-cormorant)' }}>
              {error}
            </p>
          )}
        </div>
        {/* Route d'API, pas une page : le consentement OAuth exige une vraie
            navigation du navigateur, que <Link> ne ferait pas. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/holistique/auth/google/connect"
          style={{
            padding: '12px 22px',
            background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
            border: '1px solid var(--or-ancien)',
            color: 'var(--or-ancien)',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            alignSelf: 'center',
          }}
        >
          Reconnecter
        </a>
      </div>
    );
  }

  // Connecté → bandeau turquoise + bouton déconnecter
  if (connected) {
    return (
      <div
        style={{
          background: 'rgba(46, 196, 182, 0.08)',
          border: '1px solid rgba(46, 196, 182, 0.35)',
          borderRadius: '8px',
          padding: '14px 20px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>📅</span>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              color: 'var(--turquoise-cristal)',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              margin: '0 0 2px',
            }}
          >
            Google Agenda connecté
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              opacity: 0.8,
              fontFamily: 'var(--font-cormorant)',
              color: 'var(--parchemin)',
            }}
          >
            {googleEmail ? `Compte : ${googleEmail}. ` : ''}Tes réservations confirmées s&apos;ajoutent
            automatiquement à ton agenda.
          </p>
          {error && (
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#f87171', fontFamily: 'var(--font-cormorant)' }}>
              {error}
            </p>
          )}
          {syncMsg && (
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--turquoise-cristal)', fontFamily: 'var(--font-cormorant)' }}>
              {syncMsg}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={resync}
            disabled={syncing || pending}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(46, 196, 182, 0.5)',
              color: 'var(--turquoise-cristal)',
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              borderRadius: '4px',
              cursor: syncing ? 'wait' : 'pointer',
              opacity: syncing || pending ? 0.6 : 1,
            }}
          >
            {syncing ? 'Synchronisation…' : 'Resynchroniser'}
          </button>
          <button
            type="button"
            onClick={disconnect}
            disabled={pending || syncing}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(245, 240, 232, 0.3)',
              color: 'var(--parchemin)',
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              borderRadius: '4px',
              cursor: pending ? 'wait' : 'pointer',
              opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? '…' : 'Déconnecter'}
          </button>
        </div>
      </div>
    );
  }

  // Non connecté → CTA
  const statusMessage =
    googleStatus === 'error'
      ? 'Une erreur est survenue lors de la connexion. Réessaie.'
      : googleStatus === 'denied'
        ? 'Connexion annulée.'
        : null;

  return (
    <div
      style={{
        background: 'rgba(46, 196, 182, 0.06)',
        border: '1px solid rgba(46, 196, 182, 0.35)',
        borderRadius: '8px',
        padding: '20px 24px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              color: 'var(--turquoise-cristal)',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 8px',
            }}
          >
            📅 Connecte ton Google Agenda
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              color: 'var(--parchemin)',
              opacity: 0.8,
              fontSize: '0.95rem',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Synchronise tes réservations avec ton Google Agenda : chaque RDV confirmé s&apos;y ajoute
            automatiquement et bloque la plage horaire. Tu gères ton horaire depuis un seul endroit.
          </p>
          {statusMessage && (
            <p
              style={{
                marginTop: '10px',
                fontSize: '0.85rem',
                color: '#fbbf24',
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
              }}
            >
              {statusMessage}
            </p>
          )}
        </div>
        {/* Route d'API, pas une page : le consentement OAuth exige une vraie
            navigation du navigateur, que <Link> ne ferait pas. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/holistique/auth/google/connect"
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(to right, var(--teal-profond), var(--teal-magique))',
            border: '1px solid var(--turquoise-cristal)',
            color: 'var(--noir-nuit)',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            cursor: 'pointer',
            alignSelf: 'center',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Connecter Google Agenda
        </a>
      </div>
    </div>
  );
}
