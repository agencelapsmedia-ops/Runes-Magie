'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Menu épuré : 6 entrées de haut niveau. Chacune ouvre une PAGE HUB qui regroupe
// ses outils en cartes (plus de sous-liste dans le menu). `match` = préfixes de
// routes appartenant à la catégorie, pour surligner l'entrée même sur une page-outil.
const navItems: { label: string; href: string; icon: string; exact?: boolean; match: string[] }[] = [
  { label: 'Dashboard', href: '/admin', icon: 'ᛊ', exact: true, match: [] },
  {
    label: 'Boutique',
    href: '/admin/boutique',
    icon: 'ᚤ',
    match: ['/admin/boutique', '/admin/commandes', '/admin/produits', '/admin/categories', '/admin/clover'],
  },
  {
    label: 'Soins & Cours',
    href: '/admin/services',
    icon: 'ᚹ',
    match: [
      '/admin/services', '/admin/calendrier', '/admin/consultations', '/admin/praticiens',
      '/admin/offerings', '/admin/formations', '/admin/revenus-holistique',
    ],
  },
  { label: 'CRM / Clients', href: '/admin/crm', icon: 'ᛗ', match: ['/admin/crm', '/admin/clients', '/admin/conversations'] },
  { label: 'To-do liste', href: '/admin/todo', icon: 'ᛏ', match: ['/admin/todo'] },
  { label: 'Événements', href: '/admin/evenements', icon: 'ᛝ', match: ['/admin/evenements'] },
  { label: 'Publications', href: '/admin/publications', icon: 'ᛒ', match: ['/admin/publications'] },
  { label: 'Site', href: '/admin/site', icon: 'ᛟ', match: ['/admin/site'] },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Le panneau se referme à chaque navigation : sur téléphone, garder le menu
  // ouvert après un clic masquerait la page qu'on vient d'ouvrir.
  useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }
    // Bloquer les non-ADMIN qui auraient pu se loguer via le handler unifié
    // (depuis la fusion, /api/auth/* accepte aussi les HolisticUser).
    // Exception : la praticienne propriétaire (isOwner) a aussi accès à l'admin.
    if (
      status === 'authenticated' &&
      pathname !== '/admin/login' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session?.user as any)?.role &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session?.user as any).role !== 'ADMIN' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session?.user as any)?.isOwner !== true
    ) {
      router.push('/soins/dashboard/client');
    }
  }, [status, session, pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A2E' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-or-ancien" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f6f2' }}>
      {/* Barre mobile : n'existe que sous 1024 px, où le menu latéral est rétracté */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center gap-3 px-4"
              style={{ background: 'linear-gradient(90deg, #2D1B4E 0%, #1A1A2E 100%)' }}>
        <button
          type="button"
          onClick={() => setMenuOuvert(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOuvert}
          className="flex items-center justify-center w-11 h-11 -ml-2 text-or-ancien"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="font-cinzel text-or-ancien text-base truncate">
          {navItems.find((i) => (i.exact ? pathname === i.href : i.match.some((p) => pathname.startsWith(p))))?.label
            ?? 'Administration'}
        </span>
      </header>

      {/* Voile : fermer en tapant à côté est le geste attendu sur téléphone */}
      <div
        onClick={() => setMenuOuvert(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-[95] bg-black/60 transition-opacity duration-300 ${
          menuOuvert ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar — z au-dessus de la barre d'onglets (z-90), sinon celle-ci
          flotterait par-dessus le panneau ouvert et son voile. */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 flex flex-col z-[100] transition-transform duration-300 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:z-30`}
        style={{ background: 'linear-gradient(180deg, #2D1B4E 0%, #1A1A2E 100%)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-violet-royal/30">
          <span className="text-or-ancien text-xl mr-2 select-none">&#10022;</span>
          <span className="font-cinzel font-bold text-or-ancien text-lg">Runes &amp; Magie</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Propriétaire : bascule directe vers l'espace praticienne (même connexion) */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(session?.user as any)?.isOwner && (
            <Link
              href="/soins/dashboard/praticien"
              className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-lg text-sm font-semibold bg-or-ancien/15 text-or-ancien border border-or-ancien/40 hover:bg-or-ancien/25 transition-all duration-200"
            >
              <span className="text-lg select-none">ᛞ</span>
              Mon espace praticienne
            </Link>
          )}
          {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    item.match.some((p) => pathname === p || pathname.startsWith(p + '/'));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-royal/40 text-or-ancien border border-or-ancien/20 shadow-[0_0_10px_rgba(201,168,76,0.1)]'
                        : 'text-parchemin-vieilli/70 hover:bg-violet-royal/20 hover:text-parchemin border border-transparent'
                    }`}
                  >
                    <span className={`text-lg select-none ${isActive ? 'text-or-ancien' : 'text-turquoise-cristal/60'}`}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
        </nav>

        {/* Footer */}
        <div className="border-t border-violet-royal/30 px-4 py-4">
          {session?.user?.name && (
            <p className="text-sm font-cinzel font-medium text-parchemin mb-1 truncate">
              {session.user.name}
            </p>
          )}
          <Link
            href="/"
            className="text-xs text-turquoise-cristal hover:text-or-ancien transition-colors"
          >
            Voir le site &rarr;
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-0 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
