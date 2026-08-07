'use client';

import { usePathname } from 'next/navigation';

/**
 * Le `<main>` du layout racine.
 *
 * Sa marge haute compense la hauteur du `Navbar` public, qui est `fixed`. Or ce
 * Navbar ne s'affiche pas dans le back-office (il recouvrait l'en-tête de
 * l'admin) : y garder la marge laisserait une bande vide de 72 px au-dessus
 * d'un en-tête qui commence déjà à 0. La marge suit donc la barre qu'elle
 * compense, au lieu d'être posée en dur.
 *
 * `relative z-10` crée un contexte d'empilement : tout élément `fixed` rendu à
 * l'intérieur s'y retrouve piégé. C'est pourquoi `BarreOnglets` est montée sur
 * `<body>`, en dehors d'ici (voir son en-tête).
 */
export default function ZonePrincipale({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const dansAdmin = pathname.startsWith('/admin');

  return (
    <main className={`relative z-10 flex-1 min-h-screen ${dansAdmin ? '' : 'pt-18 lg:pt-20'}`}>
      {children}
    </main>
  );
}
