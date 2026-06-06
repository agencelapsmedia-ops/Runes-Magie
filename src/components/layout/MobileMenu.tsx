'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
  currentPath: string;
}

interface SessionUser {
  email?: string;
  name?: string;
  role?: string;
}

export default function MobileMenu({
  isOpen,
  onClose,
  links,
  currentPath,
}: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Charge l'état de session pour afficher le bon bouton (Connexion vs Dashboard)
  useEffect(() => {
    if (!isOpen) return;
    async function loadSession() {
      try {
        const res = await fetch('/api/holistique/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSessionUser(data.user ?? null);
        } else {
          setSessionUser(null);
        }
      } catch {
        setSessionUser(null);
      } finally {
        setSessionLoaded(true);
      }
    }
    loadSession();
  }, [isOpen]);

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap basique
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstFocusable = menuRef.current.querySelector<HTMLElement>(
        'button, a'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay sombre */}
      <div
        className={`fixed inset-0 z-[60] bg-noir-nuit/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau coulissant */}
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-sm transition-transform duration-400 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background:
            'linear-gradient(195deg, var(--violet-profond) 0%, var(--charbon-mystere) 40%, var(--noir-nuit) 100%)',
        }}
      >
        {/* En-tete avec bouton fermer */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <span className="font-cinzel-decorative text-lg font-bold text-gradient-gold">
            Runes & Magie
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-parchemin/70 transition-colors duration-300 hover:text-or-clair"
            aria-label="Fermer le menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Separateur dore */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-or-ancien/40 to-transparent" />

        {/* Liens de navigation */}
        <nav className="mt-8 px-6">
          <ul className="flex flex-col gap-2">
            {links.map((link, index) => {
              const isActive = currentPath === link.href;
              return (
                <li
                  key={link.href}
                  style={{
                    transitionDelay: isOpen ? `${index * 60 + 100}ms` : '0ms',
                  }}
                  className={`transition-all duration-300 ${
                    isOpen
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 translate-x-8'
                  }`}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`font-cinzel block rounded-lg px-4 py-3.5 text-lg font-medium uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? 'text-or-clair bg-or-ancien/10 border-l-2 border-or-ancien'
                        : 'text-or-ancien hover:text-or-clair hover:bg-or-ancien/5 border-l-2 border-transparent'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bouton Connexion / Dashboard — adaptatif selon état de session */}
        <div className="px-6 mt-6 flex flex-col gap-3">
          {sessionLoaded && !sessionUser && (
            <>
              <Link
                href="/soins/auth/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded border border-or-ancien/40 text-or-ancien font-cinzel text-sm tracking-wider transition-all duration-300 hover:bg-or-ancien/15 hover:border-or-ancien/70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Se Connecter
              </Link>
              <Link
                href="/soins/auth/register"
                onClick={onClose}
                className="flex items-center justify-center w-full px-4 py-3 rounded-md bg-gradient-to-r from-or-ancien to-or-clair text-charbon-mystere font-cinzel text-sm font-semibold uppercase tracking-[0.12em] border border-or-clair/60 transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_18px_rgba(201,168,76,0.45)]"
              >
                Rejoindre le Clan
              </Link>
            </>
          )}

          {sessionLoaded && sessionUser && (
            <>
              <div className="text-center mb-1">
                <p className="font-cinzel text-[0.65rem] tracking-widest uppercase text-or-ancien/60">
                  Connecté en tant que
                </p>
                <p className="font-cormorant italic text-parchemin text-base mt-1">
                  {sessionUser.name ?? sessionUser.email}
                </p>
              </div>
              <Link
                href={
                  sessionUser.role === 'PRACTITIONER'
                    ? '/soins/dashboard/praticien'
                    : sessionUser.role === 'ADMIN'
                    ? '/admin'
                    : '/soins/dashboard/client'
                }
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded border border-turquoise-cristal/40 text-turquoise-cristal font-cinzel text-sm tracking-wider transition-all duration-300 hover:bg-turquoise-cristal/15"
              >
                ᛟ {sessionUser.role === 'PRACTITIONER'
                  ? 'Mon espace praticien'
                  : sessionUser.role === 'ADMIN'
                  ? 'Administration'
                  : 'Mon compte'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: '/' });
                }}
                className="flex items-center justify-center w-full px-4 py-3 rounded border border-transparent text-parchemin/50 font-cinzel text-xs tracking-wider transition-all duration-300 hover:text-or-ancien hover:border-or-ancien/20"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>

        {/* Runes decoratives en bas */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="font-medieval text-2xl tracking-[0.5em] text-or-ancien/20">
            ᚠᚢᚦᚨᚱᚲ
          </p>
        </div>
      </div>
    </>
  );
}
