'use client';

/**
 * AccountMenu — replie « Mon espace », « ✦ Administration » et « Déconnexion »
 * en un seul déclencheur.
 *
 * Pourquoi : ces trois libellés côte à côte occupaient ~440 px dans la barre.
 * Entre 1024 et 1280 px, additionnés au logo et aux cinq liens du menu, le
 * total dépassait la largeur disponible d'environ 350 px — et comme rien ne
 * portait `whitespace-nowrap`, le navigateur cassait les libellés en deux
 * lignes au lieu de déborder. Le cas visible était « ÉCOLE DE MAGIE » sur
 * trois lignes. Interdire le retour à la ligne n'aurait fait que remplacer le
 * repli par un débordement : il fallait retirer du contenu, pas le contraindre.
 *
 * Sous `xl`, le déclencheur est une icône seule (~36 px) : c'est là qu'est
 * l'essentiel du gain, précisément dans la plage où la barre cassait.
 *
 * L'état `open` vit dans Navbar, pas ici : la fermeture au changement de page
 * et la séquence de déconnexion y sont déjà, et il faut aussi fermer ce menu
 * quand le menu mobile s'ouvre (il est en z-[60], ce panneau passerait dessous).
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  espacePrincipal,
  aAccesAdmin,
  type SessionUtilisateur,
} from '@/lib/session-utilisateur';

interface AccountMenuProps {
  utilisateur: SessionUtilisateur;
  onLogout: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountMenu({
  utilisateur,
  onLogout,
  open,
  onOpenChange,
}: AccountMenuProps) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const declencheurRef = useRef<HTMLButtonElement>(null);

  // La règle rôle → destination reste dans session-utilisateur.ts. Voir le
  // commentaire d'en-tête de ce fichier : elle a déjà divergé une fois pour
  // avoir été recopiée dans quatre composants.
  const espace = espacePrincipal(utilisateur);
  const montrerAdmin = aAccesAdmin(utilisateur) && espace.href !== '/admin';
  const identite = utilisateur.name ?? utilisateur.email ?? 'Mon compte';

  // Clic extérieur et Échap. L'écouteur n'existe que pendant l'ouverture.
  useEffect(() => {
    if (!open) return;

    const auClicExterieur = (e: MouseEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) onOpenChange(false);
    };

    const auClavier = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onOpenChange(false);
      // Rendre le focus au déclencheur : sans ça, la tabulation repart du haut
      // du document et l'utilisateur au clavier perd sa place.
      declencheurRef.current?.focus();
    };

    document.addEventListener('mousedown', auClicExterieur);
    document.addEventListener('keydown', auClavier);
    return () => {
      document.removeEventListener('mousedown', auClicExterieur);
      document.removeEventListener('keydown', auClavier);
    };
  }, [open, onOpenChange]);

  const classeEntree =
    'block w-full px-4 py-2.5 text-left font-cinzel text-[0.7rem] uppercase tracking-[0.1em] transition-colors duration-200';

  return (
    <div ref={conteneurRef} className="relative shrink-0">
      <button
        ref={declencheurRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="menu-compte"
        title={`Connecté en tant que ${identite}`}
        className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-parchemin/80 font-cinzel text-[0.7rem] uppercase tracking-[0.1em] whitespace-nowrap transition-colors duration-300 hover:text-or-clair"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        {/* Libellé masqué sous xl : c'est le gain de place qui règle le repli. */}
        <span className="hidden xl:inline max-w-[9ch] truncate">{espace.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Démonté quand fermé : sinon on tabule dans des liens invisibles. */}
      {open && (
        <div
          id="menu-compte"
          role="menu"
          aria-label="Menu du compte"
          className="absolute right-0 top-full mt-2 w-56 rounded-md border border-or-ancien/30 bg-charbon-mystere/95 backdrop-blur-md py-2 shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
        >
          {/* Cette information n'existait que dans une infobulle `title`. */}
          <div className="px-4 pb-2 border-b border-or-ancien/20">
            <p className="font-cinzel text-[0.6rem] uppercase tracking-[0.1em] text-parchemin/40">
              Connecté en tant que
            </p>
            <p className="truncate font-cormorant text-sm text-parchemin/90">{identite}</p>
          </div>

          <Link
            href={espace.href}
            role="menuitem"
            onClick={() => onOpenChange(false)}
            className={`${classeEntree} text-parchemin/85 hover:bg-or-ancien/10 hover:text-or-clair`}
          >
            {espace.labelLong}
          </Link>

          {montrerAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => onOpenChange(false)}
              className={`${classeEntree} text-or-ancien/90 hover:bg-or-ancien/10 hover:text-or-clair`}
            >
              <span aria-hidden>✦</span> Administration
            </Link>
          )}

          <div className="my-1 h-px bg-or-ancien/20" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenChange(false);
              onLogout();
            }}
            className={`${classeEntree} text-parchemin/50 hover:bg-or-ancien/10 hover:text-or-ancien`}
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
