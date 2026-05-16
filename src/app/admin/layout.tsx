'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: 'ᛊ' },
  { label: 'Clients', href: '/admin/clients', icon: 'ᛗ' },
  { label: 'Commandes', href: '/admin/commandes', icon: 'ᚲ' },
  { label: 'Produits', href: '/admin/produits', icon: 'ᚦ' },
  { label: 'Produits (grille)', href: '/admin/produits/grid', icon: 'ᚤ' },
  { label: 'Catégories', href: '/admin/categories', icon: 'ᛚ' },
  { label: 'Clover', href: '/admin/clover', icon: 'ᚷ' },
  { label: 'Calendrier', href: '/admin/calendrier', icon: 'ᛃ' },
  { label: 'Rendez-vous', href: '/admin/rendez-vous', icon: 'ᛈ' },
  { label: 'Services', href: '/admin/services', icon: 'ᚹ' },
  { label: 'Disponibilites', href: '/admin/disponibilites', icon: 'ᛟ' },
  { label: 'Praticiens', href: '/admin/praticiens', icon: 'ᚻ' },
  { label: 'Consultations', href: '/admin/consultations', icon: 'ᛜ' },
  { label: 'Revenus Holistique', href: '/admin/revenus-holistique', icon: 'ᚴ' },
  { label: 'Parametres', href: '/admin/parametres', icon: 'ᚱ' },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, pathname, router]);

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
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-30" style={{ background: 'linear-gradient(180deg, #2D1B4E 0%, #1A1A2E 100%)' }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-violet-royal/30">
          <span className="text-or-ancien text-xl mr-2 select-none">&#10022;</span>
          <span className="font-cinzel font-bold text-or-ancien text-lg">Runes &amp; Magie</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

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
      <main className="ml-64 p-8">{children}</main>
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
