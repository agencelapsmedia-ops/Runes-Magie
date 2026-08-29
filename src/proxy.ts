import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * SITE COMPLÈTEMENT HORS LIGNE (2026-08-28, à la demande de Jonathan).
 * 'TOTAL'   → TOUT le domaine répond une page vide (503) : public, admin, API.
 * 'PUBLIC'  → seul le site public affiche la page blanche (/maintenance) ;
 *             l'admin, la connexion et les API restent accessibles.
 * false     → site normal.
 * Basculer cette constante puis pousser sur main.
 */
const MAINTENANCE: 'TOTAL' | 'PUBLIC' | false = false;

export function proxy(request: NextRequest) {
  if (MAINTENANCE === 'TOTAL') {
    return new NextResponse('', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  if (MAINTENANCE === 'PUBLIC') {
    const { pathname } = request.nextUrl;
    const autorise =
      pathname === '/maintenance' ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/soins/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.');
    if (!autorise) return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
