import type { MetadataRoute } from 'next';

/**
 * Manifeste d'application — permet « Ajouter à l'écran d'accueil ».
 *
 * `start_url` pointe sur /admin : ce manifeste est un outil de travail pour
 * l'équipe, pas une fonctionnalité destinée aux visiteuses. À revoir le jour
 * où l'on voudrait proposer l'installation aux clientes.
 *
 * `display: 'standalone'` retire la barre d'adresse du navigateur, ce qui
 * regagne environ 15 % de hauteur d'écran — décisif sur un agenda.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Runes & Magie — Administration',
    short_name: 'Runes & Magie',
    description: 'Agenda, boutique et clientèle de Runes & Magie.',
    start_url: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0A12',
    theme_color: '#2D1B4E',
    lang: 'fr-CA',
    icons: [
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
