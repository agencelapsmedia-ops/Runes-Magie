import type { MetadataRoute } from 'next';

/**
 * Manifeste d'application web — rend le site installable comme une
 * application (« Télécharger l'application » sur l'accueil, ou
 * « Ajouter à l'écran d'accueil » sur iOS).
 *
 * Historique : jusqu'en août 2026, ce manifeste servait uniquement
 * l'équipe (start_url `/admin`). Il est désormais destiné aux
 * visiteuses ; les installations déjà en place chez l'équipe conservent
 * leur start_url d'origine, figé au moment de l'installation — rien à
 * refaire de leur côté.
 *
 * `display: 'standalone'` retire la barre d'adresse du navigateur : le
 * site s'ouvre plein écran, avec sa propre icône, comme une application.
 * L'installabilité Chrome/Android s'appuie aussi sur `public/sw.js` et
 * sur le script inline du layout racine (capture de l'invite).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Runes & Magie — École de Magie',
    short_name: 'Runes & Magie',
    description:
      'Boutique ésotérique, soins holistiques et école de magie — runes vikings, tarot et savoir ancestral.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0A0A12',
    theme_color: '#2D1B4E',
    lang: 'fr-CA',
    categories: ['shopping', 'education', 'lifestyle'],
    icons: [
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
