import type { ReactNode } from 'react';

/**
 * Jeu d'icônes au trait, dessinées en SVG dans le code.
 *
 * Pourquoi pas des fichiers image ni une bibliothèque : chaque icône serait un
 * aller-retour réseau de plus au-dessus de la ligne de flottaison (la grille de
 * l'accueil en compte neuf), et une bibliothèque ajouterait une dépendance à
 * surveiller pour une vingtaine de glyphes. Ici tout part avec le HTML.
 *
 * `stroke="currentColor"` : la couleur est héritée du parent, donc l'or du site
 * s'applique sans réglage. Le tracé reste net à n'importe quelle taille.
 *
 * Les icônes sont désignées par une clé texte stockée en base : l'admin choisit
 * dans une liste, sans rien téléverser.
 */

const TRACES: Record<string, ReactNode> = {
  // ── Cérémonies ────────────────────────────────────────────────────────
  anneaux: (
    <>
      <circle cx="9" cy="14" r="6" />
      <circle cx="15" cy="14" r="6" />
      <path d="M12 3.5 13.6 6h-3.2z" />
    </>
  ),
  naissance: (
    <>
      <path d="M8.5 20c-2.2 0-3.5-1.7-3.5-3.8 0-2.9 2-5.2 4.4-6.4 1-.5 2.1.2 2.1 1.3v5.2c0 2-1.2 3.7-3 3.7z" />
      <circle cx="13.5" cy="7.5" r="1.3" />
      <circle cx="16.5" cy="6" r="1.2" />
      <circle cx="19" cy="7.5" r="1.1" />
    </>
  ),
  flamme: (
    <>
      <path d="M12 3c2.5 3.2 5 5.4 5 8.8A5 5 0 0 1 7 12c0-1.6.7-2.8 1.7-4 .4 1 1 1.6 1.8 1.9C10.2 7.6 10.7 5.2 12 3z" />
    </>
  ),
  groupe: (
    <>
      <circle cx="12" cy="8" r="2.6" />
      <path d="M7.5 19c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2" />
      <circle cx="5" cy="10" r="1.9" />
      <path d="M2 18c0-1.9 1.3-3.2 3-3.2" />
      <circle cx="19" cy="10" r="1.9" />
      <path d="M22 18c0-1.9-1.3-3.2-3-3.2" />
    </>
  ),
  mains: (
    <>
      <path d="M4 10v3a8 8 0 0 0 16 0v-3" />
      <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M13 10V5.5a1.5 1.5 0 0 1 3 0V11" />
    </>
  ),
  boule: (
    <>
      <circle cx="12" cy="10" r="6" />
      <path d="M9.5 8.5a3 3 0 0 1 2.5-2" />
      <path d="M6.5 19h11l-1.5-3h-8z" />
    </>
  ),
  grimoire: (
    <>
      <path d="M12 6.5C10.4 5.2 8.4 4.5 5 4.5v13c3.4 0 5.4.7 7 2 1.6-1.3 3.6-2 7-2v-13c-3.4 0-5.4.7-7 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  rune: (
    <>
      <path d="M8 3v18" />
      <path d="M8 3h5.5a3.8 3.8 0 0 1 0 7.6H8" />
      <path d="M11 10.6 16.5 21" />
    </>
  ),
  cartes: (
    <>
      <rect x="3.5" y="6" width="10" height="14" rx="1.6" transform="rotate(-10 8.5 13)" />
      <rect x="11" y="4.5" width="10" height="14" rx="1.6" transform="rotate(10 16 11.5)" />
    </>
  ),
  mortier: (
    <>
      <path d="M4.5 10h15a7.5 7.5 0 0 1-15 0z" />
      <path d="M12 17.5v3" />
      <path d="M14.5 8 19 3.5" />
      <path d="M17.5 2 21 5.5" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 4c2 2.2 3 4.4 3 6.6 0 2-1.3 3.6-3 4.6-1.7-1-3-2.6-3-4.6C9 8.4 10 6.2 12 4z" />
      <path d="M8.6 9.4C6.9 9.9 5.3 11 4 12.7c1.9 2.6 4.9 4.1 8 4.1s6.1-1.5 8-4.1c-1.3-1.7-2.9-2.8-4.6-3.3" />
    </>
  ),

  // ── Grille de l'accueil ───────────────────────────────────────────────
  livre: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v2H5.5A1.5 1.5 0 0 1 4 19.5z" />
      <path d="M9 8h6" />
    </>
  ),
  feuille: (
    <>
      <path d="M5 19c0-7 4.5-12 14-12 0 8.5-5 12-10 12H5z" />
      <path d="M5 19c3.5-4 6.5-6.5 11-8.5" />
    </>
  ),
  calendrier: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v4M16 3.5v4" />
      <circle cx="8.5" cy="14" r=".9" />
      <circle cx="12" cy="14" r=".9" />
      <circle cx="15.5" cy="14" r=".9" />
    </>
  ),
  temple: (
    <>
      <path d="M3 9 12 3.5 21 9z" />
      <path d="M5.5 9v9M10 9v9M14 9v9M18.5 9v9" />
      <path d="M3 18h18M3 20.5h18" />
    </>
  ),
  sac: (
    <>
      <path d="M5 7.5h14l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M8.8 10V6.7a3.2 3.2 0 0 1 6.4 0V10" />
    </>
  ),
  cristal: (
    <>
      <path d="M12 2.5 17.5 9 12 21.5 6.5 9z" />
      <path d="M6.5 9h11" />
      <path d="M12 2.5V21.5" />
    </>
  ),
  tarot: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="1.8" />
      <path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" />
    </>
  ),
  'capteur-reves': (
    <>
      <circle cx="12" cy="8.5" r="6" />
      <path d="M6.4 6.2 17.6 10.8M17.6 6.2 6.4 10.8M12 2.5v12M6 8.5h12" />
      <path d="M12 14.5v6M9.5 17l-.8 3M14.5 17l.8 3" />
    </>
  ),
  encens: (
    <>
      <path d="M4.5 16h15a6 6 0 0 1-15 0z" />
      <path d="M9.5 12c1.5-1.4-.8-2.8.6-4.3M14 12c1.5-1.4-.8-2.8.6-4.3" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  sauge: (
    <>
      <path d="M9 21c-1-4 .5-8 3-11.5S16.5 3 18.5 2.5c.5 2.5-.5 6-2.5 9S11 19 10.5 21z" />
      <path d="M6 21h9" />
      <path d="M8.5 17.5c2 .4 4 .2 5.5-.6" />
    </>
  ),
  statuette: (
    <>
      <circle cx="12" cy="5" r="2.2" />
      <path d="M12 7.2c-2.6 0-4 2.2-4 5.2 0 2 .8 3.4 1.6 4.3h4.8c.8-.9 1.6-2.3 1.6-4.3 0-3-1.4-5.2-4-5.2z" />
      <path d="M7 20.5h10" />
      <path d="M9 17.5v3M15 17.5v3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13M5.5 12h13" />
    </>
  ),
  lune: (
    <>
      <path d="M19 14.5A8 8 0 0 1 9.5 5 8.2 8.2 0 1 0 19 14.5z" />
    </>
  ),
  bulle: (
    <>
      <path d="M20.5 11.5c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.6-.3L4.5 20.5l1.3-3.5a6.8 6.8 0 0 1-2.3-5c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2z" />
    </>
  ),
  personne: (
    <>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M5.5 20.5c0-3.6 2.9-6.1 6.5-6.1s6.5 2.5 6.5 6.1" />
    </>
  ),
  etoile: (
    <>
      <path d="M12 3.5 14 9.4l6 .4-4.6 3.8 1.5 5.9L12 16.3l-4.9 3.2 1.5-5.9L4 9.8l6-.4z" />
    </>
  ),
};

/** Clés disponibles — alimente la liste déroulante de l'admin et la validation. */
export const CLES_ICONES = Object.keys(TRACES).sort();

export default function IconeCategorie({
  nom,
  taille = 24,
  className,
}: {
  nom: string;
  taille?: number;
  className?: string;
}) {
  // Une clé inconnue ne doit jamais casser une page : on retombe sur l'étoile.
  const trace = TRACES[nom] ?? TRACES.etoile;
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {trace}
    </svg>
  );
}
