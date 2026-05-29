'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface SessionUser {
  email?: string;
  name?: string;
  role?: string;
}

export default function UserNav() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/holistique/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  if (loading) {
    return (
      <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'rgba(232, 220, 190, 0.3)', letterSpacing: '0.1em' }}>
        ...
      </span>
    );
  }

  // Pas connecté : afficher le lien Connexion
  if (!user) {
    return (
      <Link
        href="/soins/auth/login"
        className="font-cinzel text-xs uppercase tracking-widest text-parchemin/70 hover:text-or-ancien transition-colors duration-300 hidden sm:block"
      >
        Connexion
      </Link>
    );
  }

  // Connecté : afficher nom + menu déroulant avec déconnexion
  const firstName = user.name?.split(' ')[0] ?? user.email ?? 'Mon compte';
  const dashboardHref =
    user.role === 'PRACTITIONER'
      ? '/soins/dashboard/praticien'
      : user.role === 'ADMIN'
      ? '/admin'
      : '/soins/dashboard/client';

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(46, 196, 182, 0.08)',
          border: '1px solid rgba(46, 196, 182, 0.3)',
          borderRadius: '4px',
          color: 'var(--turquoise-cristal)',
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>ᛟ</span>
        <span>{firstName}</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{menuOpen ? '▲' : '▼'}</span>
      </button>

      {menuOpen && (
        <>
          {/* Overlay pour fermer en cliquant ailleurs */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          {/* Menu déroulant */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '220px',
              background: 'rgba(10, 10, 18, 0.98)',
              border: '1px solid rgba(74, 45, 122, 0.5)',
              borderRadius: '6px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              padding: '8px',
              zIndex: 50,
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(74, 45, 122, 0.3)', marginBottom: '8px' }}>
              <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                Connecté en tant que
              </p>
              <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', fontSize: '0.95rem', margin: 0, fontStyle: 'italic' }}>
                {user.name ?? user.email}
              </p>
              {user.role && (
                <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--turquoise-cristal)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 0' }}>
                  {user.role === 'CLIENT' ? 'Client·e' : user.role === 'PRACTITIONER' ? 'Praticien·ne' : 'Administrateur·rice'}
                </p>
              )}
            </div>

            <Link
              href={dashboardHref}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '8px 16px',
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.78rem',
                color: 'var(--parchemin)',
                textDecoration: 'none',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              Mon tableau de bord
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/soins' })}
              style={{
                width: '100%',
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.78rem',
                letterSpacing: '0.05em',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  );
}
