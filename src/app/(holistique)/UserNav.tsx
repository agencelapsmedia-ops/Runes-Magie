'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface SessionUser {
  email?: string;
  name?: string;
  role?: string;
  isOwner?: boolean;
}

export default function UserNav() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

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
        …
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

  // Connecté : bouton Tableau de bord (selon rôle) + petit lien Déconnexion
  const firstName = user.name?.split(' ')[0] ?? '';
  const dashboardHref =
    user.role === 'PRACTITIONER'
      ? '/soins/dashboard/praticien'
      : user.role === 'ADMIN'
      ? '/admin'
      : '/soins/dashboard/client';

  const dashboardLabel =
    user.role === 'PRACTITIONER'
      ? 'Mon espace praticien'
      : user.role === 'ADMIN'
      ? 'Administration'
      : 'Mon compte';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <Link
        href={dashboardHref}
        title={firstName ? `Connecté en tant que ${firstName}` : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(46, 196, 182, 0.1)',
          border: '1px solid rgba(46, 196, 182, 0.4)',
          borderRadius: '4px',
          color: 'var(--turquoise-cristal)',
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>ᛟ</span>
        <span className="hidden sm:inline">{dashboardLabel}</span>
        <span className="sm:hidden">Mon compte</span>
      </Link>

      {/* Propriétaire : accès direct à l'administration, sans re-connexion */}
      {user.isOwner && (
        <Link
          href="/admin"
          title="Administration"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(201, 168, 76, 0.1)',
            border: '1px solid rgba(201, 168, 76, 0.4)',
            borderRadius: '4px',
            color: 'var(--or-ancien)',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '0.85rem' }}>✦</span>
          <span className="hidden sm:inline">Administration</span>
        </Link>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/soins' })}
        title="Se déconnecter"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(232, 220, 190, 0.5)',
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '4px 6px',
        }}
        className="hover:text-or-ancien transition-colors"
      >
        Déconnexion
      </button>
    </div>
  );
}
