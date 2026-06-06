'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export interface MembreUser {
  firstName: string;
  lastName: string;
  email: string;
}

const NAV_ITEMS = [
  { href: '/compte', label: 'Tableau de bord', icon: '🏠', exact: true },
  { href: '/compte/formations', label: 'Mes formations', icon: '🎓' },
  { href: '/compte/merestegere', label: 'Le Merestegere', icon: '📖' },
  { href: '/compte/veillees', label: 'Les Veillées de Noctura', icon: '🌙' },
  { href: '/compte/achats', label: 'Achats & factures', icon: '🛒' },
  { href: '/compte/bibliotheque', label: 'Bibliothèque', icon: '📚' },
  { href: '/compte/profil', label: 'Mon profil', icon: '⚙️' },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
}

function initials(user: MembreUser): string {
  return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '✦';
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, 'exact' in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-sm px-3 py-2.5 font-cinzel text-xs uppercase tracking-widest transition-all duration-200"
            style={{
              color: active ? 'var(--or-ancien)' : 'rgba(232, 220, 190, 0.6)',
              background: active ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--or-ancien)' : 'transparent'}`,
            }}
          >
            <span aria-hidden className="text-base leading-none opacity-90">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  user,
  pathname,
  onNavigate,
}: {
  user: MembreUser;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* En-tête / identité du membre */}
      <Link href="/" onClick={onNavigate} className="block px-5 pt-6 pb-5">
        <span className="font-cinzel-decorative text-lg text-or-ancien">Runes &amp; Magie</span>
        <span className="mt-0.5 block font-cinzel text-[0.6rem] uppercase tracking-[0.2em] text-parchemin/40">
          Espace membre
        </span>
      </Link>

      <div
        className="mx-5 mb-4 flex items-center gap-3 rounded-sm px-3 py-3"
        style={{ background: 'rgba(74, 45, 122, 0.18)', border: '1px solid rgba(74, 45, 122, 0.35)' }}
      >
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-cinzel text-sm text-or-ancien"
          style={{ background: 'rgba(74, 45, 122, 0.5)', border: '1px solid rgba(74, 45, 122, 0.7)' }}
        >
          {initials(user)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-cinzel text-xs text-parchemin">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate font-cormorant text-sm text-parchemin/45">{user.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>

      {/* Déconnexion */}
      <div className="border-t p-3" style={{ borderColor: 'rgba(74, 45, 122, 0.25)' }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 font-cinzel text-xs uppercase tracking-widest text-parchemin/50 transition-colors duration-200 hover:text-parchemin"
        >
          <span aria-hidden>⏻</span>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function MembreShell({
  user,
  children,
}: {
  user: MembreUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentLabel =
    NAV_ITEMS.find((i) => isActive(pathname, i.href, 'exact' in i ? i.exact : false))?.label ??
    'Espace membre';

  return (
    <div className="min-h-screen bg-noir-nuit text-parchemin">
      {/* ── Sidebar desktop (fixe) ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r lg:block"
        style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
      >
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* ── Header mobile (sticky) ── */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 lg:hidden"
        style={{
          background: 'rgba(10, 10, 18, 0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(74, 45, 122, 0.3)',
        }}
      >
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-sm border text-or-ancien"
          style={{ borderColor: 'rgba(201, 168, 76, 0.35)' }}
        >
          <span aria-hidden className="text-lg leading-none">
            ☰
          </span>
        </button>
        <span className="flex-1 truncate font-cinzel text-xs uppercase tracking-widest text-parchemin/80">
          {currentLabel}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full font-cinzel text-xs text-or-ancien"
          style={{ background: 'rgba(74, 45, 122, 0.5)', border: '1px solid rgba(74, 45, 122, 0.7)' }}
        >
          {initials(user)}
        </span>
      </header>

      {/* ── Drawer mobile ── */}
      {drawerOpen && (
        <div className="lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          {/* Panneau */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-[82%] max-w-[300px] border-r shadow-2xl"
            style={{
              background: 'var(--charbon-mystere)',
              borderColor: 'rgba(74, 45, 122, 0.4)',
              animation: 'membre-drawer-in 0.25s ease-out',
            }}
          >
            <SidebarContent
              user={user}
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      <main className="lg:pl-[260px]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</div>
      </main>

      <style>{`
        @keyframes membre-drawer-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
