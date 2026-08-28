import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MODE MAINTENANCE (2026-08-28, à la demande de Jonathan).
 * true  → tout le site public affiche /maintenance (« Temporairement hors service »).
 * false → site normal. Basculer cette constante puis pousser sur main.
 *
 * Restent accessibles pendant la maintenance :
 *  - /admin (l'administration / espace Noctura)
 *  - /soins/auth (connexion — nécessaire pour entrer dans l'admin)
 *  - /api (webhooks Stripe, crons, chat… ne doivent jamais casser)
 *  - les assets (_next, images, favicon…)
 */
const MAINTENANCE = true;

export function proxy(request: NextRequest) {
  if (!MAINTENANCE) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const autorise =
    pathname === '/maintenance' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/soins/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.'); // fichiers statiques (images, favicon, manifest…)

  if (autorise) return NextResponse.next();

  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: '/:path*',
};
