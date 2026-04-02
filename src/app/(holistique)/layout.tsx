import type { ReactNode } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function HolistiqueLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-noir-nuit text-parchemin">
      {/* Navbar holistique */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-violet-royal/30"
        style={{ backgroundColor: 'rgba(10, 10, 18, 0.95)', backdropFilter: 'blur(12px)' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/soins"
            className="flex-shrink-0 font-cinzel text-sm sm:text-base tracking-widest text-or-ancien hover:text-or-clair transition-colors duration-300"
          >
            <span className="hidden sm:inline">Soins Holistiques</span>
            <span className="sm:hidden">Soins</span>
            <span className="text-violet-mystique mx-2">|</span>
            <span className="font-cinzel-decorative">Runes & Magie</span>
          </Link>

          {/* Liens de navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/soins/praticiens"
              className="font-cinzel text-xs uppercase tracking-widest text-parchemin/70 hover:text-or-ancien transition-colors duration-300"
            >
              Praticiens
            </Link>
            <Link
              href="/soins#comment"
              className="font-cinzel text-xs uppercase tracking-widest text-parchemin/70 hover:text-or-ancien transition-colors duration-300"
            >
              Comment ça marche
            </Link>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/soins/auth/login"
              className="font-cinzel text-xs uppercase tracking-widest text-parchemin/70 hover:text-or-ancien transition-colors duration-300 hidden sm:block"
            >
              Connexion
            </Link>
            <Button href="/soins/inscription-praticien" variant="primary" size="sm">
              Devenir praticien
            </Button>
          </div>
        </nav>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer simple */}
      <footer className="border-t border-violet-royal/20 py-8"
        style={{ backgroundColor: 'var(--charbon-mystere)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-philosopher text-sm text-parchemin/40">
            &copy; {new Date().getFullYear()} Runes & Magie — Soins Holistiques. Tous droits réservés.
          </p>
          <p className="font-cormorant italic text-xs text-parchemin/25 mt-1">
            Plateforme de soins énergétiques certifiés au Québec
          </p>
        </div>
      </footer>
    </div>
  );
}
