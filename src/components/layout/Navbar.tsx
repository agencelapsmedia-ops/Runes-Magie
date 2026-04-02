'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import MobileMenu from './MobileMenu';
import GhostCaracal from '@/components/hero/GhostCaracal';

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Services', href: '/services' },
  { label: 'Runes Vikings', href: '/runes-vikings' },
  { label: '\u00C0 Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
  { label: 'R\u00E9server', href: '/reserver' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount] = useState(0);
  const [ghostTrigger, setGhostTrigger] = useState(0);

  const handleConnexion = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setGhostTrigger((n) => n + 1);
    // Laisse l'animation démarrer, puis navigue
    setTimeout(() => router.push('/admin/login'), 500);
  }, [router]);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Bloquer le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled
            ? 'bg-charbon-mystere/95 backdrop-blur-md border-or-ancien/30'
            : 'bg-charbon-mystere/70 backdrop-blur-sm border-or-ancien/15'
        }`}
        style={{
          boxShadow: scrolled
            ? '0 2px 20px rgba(201, 168, 76, 0.15)'
            : '0 1px 10px rgba(201, 168, 76, 0.08)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="Runes & Magie - Accueil"
            >
              <div className="relative h-12 w-10 flex items-center justify-center transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(201,168,76,0.5)]">
                <Image
                  src="/images/logo/logo-cat-gold.png"
                  alt="Logo Runes & Magie"
                  width={120}
                  height={160}
                  className="h-full w-auto object-contain"
                />
              </div>
              <span className="font-cinzel-decorative text-base sm:text-lg font-bold text-gradient-gold">
                Runes & Magie
              </span>
            </Link>

            {/* Navigation desktop */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-cinzel relative px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 rounded-md ${
                      isActive
                        ? 'text-turquoise-cristal'
                        : 'text-parchemin/80 hover:text-or-clair'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-1/2 h-[2px] w-3/4 -translate-x-1/2 rounded-full bg-turquoise-cristal"
                        style={{
                          boxShadow: '0 0 8px rgba(46, 196, 182, 0.6)',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions droites */}
            <div className="flex items-center gap-3">
              {/* Bouton Connexion — déclenche le caracal fantôme puis navigue */}
              <button
                onClick={handleConnexion}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded border border-or-ancien/40 text-or-ancien font-cinzel text-xs tracking-wider transition-all duration-300 hover:bg-or-ancien/15 hover:border-or-ancien/70 hover:shadow-[0_0_10px_rgba(201,168,76,0.2)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Connexion
              </button>

              {/* Icone panier */}
              <Link
                href="/panier"
                className="relative p-2 text-parchemin/80 transition-colors duration-300 hover:text-or-clair"
                aria-label={`Panier (${cartCount} articles)`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-magenta-rituel text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger mobile */}
              <button
                type="button"
                className="lg:hidden p-2 text-parchemin/80 transition-colors duration-300 hover:text-or-clair"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Ouvrir le menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={NAV_LINKS}
        currentPath={pathname}
      />

      {/* Caracal fantôme — déclenché par le bouton Connexion */}
      <GhostCaracal trigger={ghostTrigger} />
    </>
  );
}
