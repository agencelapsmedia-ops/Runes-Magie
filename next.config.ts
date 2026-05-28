import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
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
      // Vieux catalogue marketing
      { source: '/services', destination: '/soins', permanent: true },
      { source: '/services/:slug', destination: '/soins', permanent: true },
      // Vieux wizard de réservation
      { source: '/reserver', destination: '/soins', permanent: true },
      { source: '/reserver/:path*', destination: '/soins', permanent: true },
    ];
  },
};

export default nextConfig;
