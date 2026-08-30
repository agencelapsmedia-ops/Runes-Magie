/**
 * Marques (organisations) du module Publications.
 *
 * Chaque marque porte une charte graphique (couleurs, polices, voix de marque,
 * hashtags) qui pilote les gabarits visuels et les prompts IA. Les modèles
 * SocialAccount/SocialPost/SocialPublishJob la référencent souplement par
 * `organizationId` (slug) — la validation est applicative, pas une FK.
 *
 * Tant que la table est vide (avant le seed), « runes-et-magie » existe
 * virtuellement avec sa charte intégrée : le module reste fonctionnel.
 */

// Imports relatifs (pas d'alias @/) : ce module est aussi chargé par les
// scripts tsx de prisma/scripts, hors résolution d'alias Next.
import { prisma } from './db';
import { ORGANIZATION_ID } from './social-constants';

export const SLUG_MARQUE_REGEX = /^[a-z0-9][a-z0-9-]{1,39}$/;

export interface PaletteCharte {
  fond: string; // fond principal des visuels (sombre pour R&M)
  fondCarte: string; // surfaces surélevées
  primaire: string;
  primaireFonce: string;
  accent: string; // titres, bordures
  accentClair: string;
  secondaire: string;
  texte: string;
}

export interface PolicesCharte {
  titre: string;
  corps: string;
  accent: string;
}

export interface CharteGraphique {
  palette: PaletteCharte;
  polices: PolicesCharte;
  logoUrl: string;
  /** Description de la voix de marque, injectée dans les prompts IA. */
  voix: string;
  /** Hashtags par défaut de la marque (avec le #). */
  hashtagsMarque: string[];
}

export const CHARTE_NEUTRE: CharteGraphique = {
  palette: {
    fond: '#101014',
    fondCarte: '#1F2430',
    primaire: '#4A5FA5',
    primaireFonce: '#2C3A6B',
    accent: '#C9A84C',
    accentClair: '#E8D48B',
    secondaire: '#3BAFA5',
    texte: '#F5F3EE',
  },
  polices: { titre: 'Inter', corps: 'Inter', accent: 'Inter' },
  logoUrl: '',
  voix: '',
  hashtagsMarque: [],
};

/** Charte officielle Runes & Magie (charte_graphique_runes_et_magie.html). */
export const CHARTE_RUNES_ET_MAGIE: CharteGraphique = {
  palette: {
    fond: '#0A0A12', // Noir Nuit
    fondCarte: '#1A1A2E', // Charbon Mystère
    primaire: '#6B3FA0', // Violet Mystique
    primaireFonce: '#2D1B4E', // Violet Profond
    accent: '#C9A84C', // Or Ancien
    accentClair: '#E8D48B', // Or Clair
    secondaire: '#2EC4B6', // Turquoise Cristal
    texte: '#F5F0E8', // Parchemin
  },
  polices: { titre: 'Cinzel', corps: 'Cormorant Garamond', accent: 'Philosopher' },
  logoUrl: '',
  voix:
    'Boutique-école ésotérique et espace de soins holistiques à Saint-Eustache, Québec. ' +
    'Style : français du Québec, tutoiement chaleureux, univers mystique doux et invitant. ' +
    'RÈGLE ABSOLUE : jamais de promesse thérapeutique, médicale ou de résultat ' +
    '(pas de « guérit », « soigne », « élimine ton anxiété », « résultat garanti ») — ' +
    'utiliser « accompagne », « favorise la détente », « un moment pour toi ».',
  hashtagsMarque: ['#runesetmagie', '#esoterisme', '#quebec'],
};

function chaine(v: unknown, defaut: string): string {
  return typeof v === 'string' ? v : defaut;
}

function couleur(v: unknown, defaut: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : defaut;
}

/** Fusionne une charte brute (Json de la base ou corps de requête) avec les défauts. */
export function normaliserCharte(brut: unknown, base: CharteGraphique = CHARTE_NEUTRE): CharteGraphique {
  const b = typeof brut === 'object' && brut !== null ? (brut as Record<string, unknown>) : {};
  const pal = typeof b.palette === 'object' && b.palette !== null ? (b.palette as Record<string, unknown>) : {};
  const pol = typeof b.polices === 'object' && b.polices !== null ? (b.polices as Record<string, unknown>) : {};
  const hashtags = Array.isArray(b.hashtagsMarque)
    ? b.hashtagsMarque.filter((h): h is string => typeof h === 'string' && h.trim().length > 0).map((h) => h.trim())
    : base.hashtagsMarque;
  return {
    palette: {
      fond: couleur(pal.fond, base.palette.fond),
      fondCarte: couleur(pal.fondCarte, base.palette.fondCarte),
      primaire: couleur(pal.primaire, base.palette.primaire),
      primaireFonce: couleur(pal.primaireFonce, base.palette.primaireFonce),
      accent: couleur(pal.accent, base.palette.accent),
      accentClair: couleur(pal.accentClair, base.palette.accentClair),
      secondaire: couleur(pal.secondaire, base.palette.secondaire),
      texte: couleur(pal.texte, base.palette.texte),
    },
    polices: {
      titre: chaine(pol.titre, base.polices.titre).slice(0, 60),
      corps: chaine(pol.corps, base.polices.corps).slice(0, 60),
      accent: chaine(pol.accent, base.polices.accent).slice(0, 60),
    },
    logoUrl: chaine(b.logoUrl, base.logoUrl).slice(0, 500),
    voix: chaine(b.voix, base.voix).slice(0, 2000),
    hashtagsMarque: hashtags.slice(0, 20),
  };
}

export interface OrganisationSerialisee {
  id: string;
  name: string;
  charte: CharteGraphique;
  isActive: boolean;
}

const RUNES_ET_MAGIE_VIRTUELLE: OrganisationSerialisee = {
  id: ORGANIZATION_ID,
  name: 'Runes & Magie',
  charte: CHARTE_RUNES_ET_MAGIE,
  isActive: true,
};

function serialiser(o: { id: string; name: string; charte: unknown; isActive: boolean }): OrganisationSerialisee {
  const base = o.id === ORGANIZATION_ID ? CHARTE_RUNES_ET_MAGIE : CHARTE_NEUTRE;
  return { id: o.id, name: o.name, charte: normaliserCharte(o.charte, base), isActive: o.isActive };
}

/** Toutes les marques (actives d'abord). Jamais vide : R&M virtuelle avant le seed. */
export async function listeOrganisations(): Promise<OrganisationSerialisee[]> {
  const orgs = await prisma.organization.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  if (orgs.length === 0) return [RUNES_ET_MAGIE_VIRTUELLE];
  return orgs.map(serialiser);
}

/** Une marque par slug — R&M virtuelle si la table ne la contient pas encore. */
export async function getOrganisation(id: string): Promise<OrganisationSerialisee | null> {
  if (!SLUG_MARQUE_REGEX.test(id)) return null;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (org) return serialiser(org);
  return id === ORGANIZATION_ID ? RUNES_ET_MAGIE_VIRTUELLE : null;
}

/**
 * Résout un organizationId candidat (query ou corps de requête) vers un slug
 * valide et existant — repli sur la marque par défaut sinon.
 */
export async function resoudreOrgId(candidat: unknown): Promise<string> {
  if (typeof candidat === 'string' && SLUG_MARQUE_REGEX.test(candidat) && candidat !== ORGANIZATION_ID) {
    const org = await prisma.organization.findUnique({ where: { id: candidat }, select: { id: true } });
    if (org) return org.id;
  }
  return ORGANIZATION_ID;
}
