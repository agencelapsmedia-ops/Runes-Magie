'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  useSessionUtilisateur,
  espacePrincipal,
  aAccesAdmin,
  oublierSession,
} from '@/lib/session-utilisateur';

export default function UserNav() {
  const { utilisateur: user, charge } = useSessionUtilisateur();
  const loading = !charge;

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
  const espace = espacePrincipal(user);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <Link
        href={espace.href}
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
        {/* Un écran étroit raccourcit le libellé, il ne rétrograde personne :
            les deux formes désignent la même destination. Auparavant le mobile
            affichait « Mon compte » en dur, ce qui faisait passer la
            praticienne pour une cliente ordinaire. */}
        <span className="hidden sm:inline">{espace.labelLong}</span>
        <span className="sm:hidden">{espace.label}</span>
      </Link>

      {/* Propriétaire ou admin : accès direct à l'administration, sans re-connexion */}
      {aAccesAdmin(user) && (
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
          {/* Sur mobile ce lien n'était qu'une étoile nue, indéchiffrable. */}
          <span className="hidden sm:inline">Administration</span>
          <span className="sm:hidden">Admin</span>
        </Link>
      )}

      <button
        type="button"
        onClick={() => {
          oublierSession();
          signOut({ callbackUrl: '/soins' });
        }}
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
