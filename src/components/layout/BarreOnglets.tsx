'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  action?: 'chat' | 'reservation';
}

const ONGLETS_COMMUNS: Onglet[] = [
  { cle: 'accueil', label: 'Accueil', icone: 'lune', href: '/', exact: true },
  { cle: 'boutique', label: 'Boutique', icone: 'sac', href: '/boutique' },
  // « Réservation » ouvre un petit choix (cours de formation OU soin) plutôt
  // que d'amener directement aux séances — les élèves réservent leurs cours.
  { cle: 'reservation', label: 'Réservation', icone: 'calendrier', action: 'reservation' },
  { cle: 'messages', label: 'Messages', icone: 'bulle', action: 'chat' },
];

export default function BarreOnglets() {
  const pathname = usePathname() ?? '/';
  const { utilisateur } = useSessionUtilisateur();
  const [choixReservation, setChoixReservation] = useState(false);

  // La barre reste visible dans le back-office. Elle en était exclue au motif
  // que « l'admin a sa propre navigation » — sauf que sur téléphone cette
  // navigation-là est repliée derrière un bouton hamburger : on se retrouvait
  // donc sans aucune sortie visible. Le `<body>` réserve déjà les 76 px du bas
  // sur toutes les pages, l'admin comprise, alors l'espace existait et restait
  // simplement vide. Seule la page de connexion en est dispensée : on n'y
  // propose pas de naviguer ailleurs.
  if (pathname === '/admin/login') return null;

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
                  onClick={() =>
                    onglet.action === 'reservation'
                      ? setChoixReservation(true)
                      : window.dispatchEvent(new CustomEvent('noctura:ouvrir'))
                  }
                >
                  {contenu}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Petit choix « cours ou soin ? » au-dessus de la barre */}
      {choixReservation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Que veux-tu réserver ?"
          className="fixed inset-0 z-[95]"
          style={{ background: 'rgba(10, 10, 18, 0.6)' }}
          onClick={() => setChoixReservation(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-3 rounded-lg border border-or-ancien/40 bg-noir-nuit p-5 shadow-2xl"
            style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
          >
            <p className="mb-4 text-center font-cinzel text-sm uppercase tracking-widest text-or-ancien">
              Que veux-tu réserver ?
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/soins?offering=cours-formation-runes"
                onClick={() => setChoixReservation(false)}
                className="rounded-sm border border-or-ancien/50 px-5 py-4 text-center font-cinzel text-[0.72rem] uppercase tracking-widest text-or-ancien"
                style={{ background: 'rgba(107, 63, 160, 0.25)' }}
              >
                ᚱ Un cours de Runes
              </Link>
              <Link
                href="/soins?offering=cours-formation-tarot"
                onClick={() => setChoixReservation(false)}
                className="rounded-sm border border-or-ancien/50 px-5 py-4 text-center font-cinzel text-[0.72rem] uppercase tracking-widest text-or-ancien"
                style={{ background: 'rgba(107, 63, 160, 0.25)' }}
              >
                🃏 Un cours de Tarot
              </Link>
              <Link
                href="/seances"
                onClick={() => setChoixReservation(false)}
                className="rounded-sm border border-turquoise-cristal/40 px-5 py-4 text-center font-cinzel text-[0.72rem] uppercase tracking-widest text-turquoise-cristal"
                style={{ background: 'rgba(46, 196, 182, 0.08)' }}
              >
                ᛉ Un soin ou une consultation
              </Link>
              <button
                type="button"
                onClick={() => setChoixReservation(false)}
                className="py-2 text-center font-cormorant text-sm italic text-parchemin/50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
