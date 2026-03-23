'use client';

import { useSession, SessionProvider } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '&#9632;' },
  { label: 'Calendrier', href: '/admin/calendrier', icon: '&#9783;' },
  { label: 'Rendez-vous', href: '/admin/rendez-vous', icon: '&#9998;' },
  { label: 'Services', href: '/admin/services', icon: '&#10022;' },
  { label: 'Disponibilites', href: '/admin/disponibilites', icon: '&#9200;' },
  { label: 'Parametres', href: '/admin/parametres', icon: '&#9881;' },
];

function AdminContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, pathname, router]);

  // Login page - no layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-violet-600 text-xl">&#10022;</span>
            <span className="font-semibold text-gray-900 text-lg">Runes & Magie</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1">Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span
                  className={`text-base ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 mb-2">{session.user?.name}</div>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-violet-600 transition-colors"
          >
            Voir le site &rarr;
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminContent>{children}</AdminContent>
    </SessionProvider>
  );
}
