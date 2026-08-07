'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import IconeCategorie from '@/components/ui/IconeCategorie';
import {
  useSessionUtilisateur,
  espacePrincipal,
  aAccesAdmin,
} from '@/lib/session-utilisateur';

/**
 * Barre d'onglets fixe en bas d'écran, sur téléphone seulement.
 *
 * C'est elle qui fait basculer la perception : un site qu'on fait défiler
 * devient une application qu'on navigue au pouce.
 *
 * Montée dans `layout.tsx` au niveau de `<body>`, jamais depuis une page :
 * `<main>` porte `relative z-10`, ce qui crée un contexte d'empilement et
 * piégerait un élément `fixed` rendu à l'intérieur. Si un jour ce composant
 * devait vivre dans une page, il faudrait le passer par `createPortal`.
 *
 * Le dernier onglet suit le rôle. À sa création la barre envoyait tout le monde
 * vers `/compte`, l'espace membre CLIENT : sur téléphone, la praticienne
 * propriétaire n'avait donc plus ni son espace ni l'administration, alors
 * qu'elle y avait toujours droit côté serveur. Les écrans étroits raccourcissent
 * les libellés, ils ne rétrogradent personne.
 */

interface Onglet {
  cle: string;
  label: string;
  icone: string;
  href?: string;
  exact?: boolean;
  action?: 'chat';
}

const ONGLETS_COMMUNS: Onglet[] = [
  { cle: 'accueil', label: 'Accueil', icone: 'lune', href: '/', exact: true },
  { cle: 'boutique', label: 'Boutique', icone: 'sac', href: '/boutique' },
  { cle: 'reservation', label: 'Réservation', icone: 'calendrier', href: '/seances' },
  { cle: 'messages', label: 'Messages', icone: 'bulle', action: 'chat' },
];

export default function BarreOnglets() {
  const pathname = usePathname() ?? '/';
  const { utilisateur } = useSessionUtilisateur();

  // Le back-office a sa propre navigation : la barre publique n'y a pas sa place.
  if (pathname.startsWith('/admin')) return null;

  const espace = espacePrincipal(utilisateur);
  // Icône de l'espace : la rune pour une praticienne (même signe que le ᛟ de
  // son en-tête), la silhouette pour une cliente ou une visiteuse.
  const iconeEspace = utilisateur?.role === 'PRACTITIONER' ? 'rune' : 'personne';

  const onglets: Onglet[] = [
    ...ONGLETS_COMMUNS,
    { cle: 'espace', label: espace.label, icone: iconeEspace, href: espace.href },
  ];

  // Sixième onglet réservé à qui administre réellement le site — en pratique
  // la propriétaire seule. Les autres gardent une barre à cinq onglets.
  if (aAccesAdmin(utilisateur)) {
    onglets.push({ cle: 'admin', label: 'Admin', icone: 'etoile', href: '/admin' });
  }

  const estActif = (onglet: Onglet) => {
    if (!onglet.href) return false;
    if (onglet.exact) return pathname === onglet.href;
    return pathname === onglet.href || pathname.startsWith(`${onglet.href}/`);
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-or-ancien/25 bg-noir-nuit/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {onglets.map((onglet) => {
          const actif = estActif(onglet);
          const contenu = (
            <>
              <IconeCategorie nom={onglet.icone} taille={22} />
              <span className="mt-1 font-cinzel text-[0.55rem] uppercase tracking-[0.1em]">
                {onglet.label}
              </span>
            </>
          );
          const classes = `flex w-full flex-col items-center justify-center py-2.5 transition-colors ${
            actif ? 'text-or-ancien' : 'text-parchemin/55'
          }`;

          return (
            <li key={onglet.cle} className="flex-1">
              {onglet.href ? (
                <Link href={onglet.href} className={classes} aria-current={actif ? 'page' : undefined}>
                  {contenu}
                </Link>
              ) : (
                <button
                  type="button"
                  className={classes}
                  onClick={() => window.dispatchEvent(new CustomEvent('noctura:ouvrir'))}
                >
                  {contenu}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
