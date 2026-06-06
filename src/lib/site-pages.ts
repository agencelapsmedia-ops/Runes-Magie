export interface SitePage {
  label: string;
  href: string;
}

/**
 * Pages publiques du site, sélectionnables dans le gestionnaire de menu
 * (liste déroulante « Ajouter une page »). Liste maintenue à la main :
 * pour rendre une nouvelle page sélectionnable, ajoute simplement une ligne.
 * (On n'auto-scanne pas src/app : ça ramènerait l'admin, les API et les
 *  gabarits dynamiques type /boutique/[slug].)
 */
export const PUBLIC_PAGES: SitePage[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Consultations holistiques', href: '/soins' },
  { label: 'Nos services & soins', href: '/soins/services' },
  { label: 'Praticiens', href: '/soins/praticiens' },
  { label: 'Runes Vikings', href: '/runes-vikings' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
  { label: 'Infolettre', href: '/infolettre' },
  { label: 'Panier', href: '/panier' },
];
