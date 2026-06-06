// Constantes client-safe (AUCUN import Prisma) : utilisables par la navbar
// et le footer (composants client) comme valeur de repli.

export interface MenuLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

/** Menu du haut affiché si la base est vide ou indisponible. */
export const DEFAULT_HEADER_LINKS: MenuLink[] = [
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

/** Liens « Navigation » du pied de page si la base est vide ou indisponible. */
export const DEFAULT_FOOTER_LINKS: MenuLink[] = [
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Infolettre', href: '/infolettre' },
  { label: 'Contact', href: '/contact' },
];
