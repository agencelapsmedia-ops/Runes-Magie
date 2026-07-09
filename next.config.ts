import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Sert automatiquement AVIF (puis WebP en repli) pour toutes les images
    // passant par next/image — meilleure compression, qualité préservée.
    formats: ['image/avif', 'image/webp'],
    // Next 16 n'autorise que [75] par défaut : on ajoute 85 (qualité élevée,
    // perte invisible) utilisé sur les images produits/services/praticiens.
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dldzopwdedpidepxnfvs.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Redirections étape 1 : tout converger vers /soins (le nouveau système)
  async redirects() {
    return [
      // Domaine canonique : l'adresse technique Vercel redirige vers le vrai domaine
      // (même page conservée). Évite de « rester coincé » sur *.vercel.app et le
      // contenu dupliqué côté SEO. Les previews Vercel (URLs uniques) ne matchent pas.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'runes-et-magie-psi.vercel.app' }],
        destination: 'https://www.runesetmagie.ca/:path*',
        permanent: true,
      },
      // Vieux catalogue marketing → nouvelle page services
      { source: '/services', destination: '/soins/services', permanent: true },
      { source: '/services/:slug', destination: '/soins/services', permanent: true },
      // Vieux wizard de réservation
      { source: '/reserver', destination: '/soins', permanent: true },
      { source: '/reserver/:path*', destination: '/soins', permanent: true },
    ];
  },
};

export default nextConfig;
