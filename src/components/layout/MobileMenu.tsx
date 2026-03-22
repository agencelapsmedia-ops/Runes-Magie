'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

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

export default function MobileMenu({
  isOpen,
  onClose,
  links,
  currentPath,
}: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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
                    className={`font-cinzel block rounded-lg px-4 py-3.5 text-lg font-medium tracking-wider transition-all duration-300 ${
                      isActive
                        ? 'text-turquoise-cristal bg-turquoise-cristal/10 border-l-2 border-turquoise-cristal'
                        : 'text-parchemin/80 hover:text-or-clair hover:bg-or-ancien/5 border-l-2 border-transparent'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

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
