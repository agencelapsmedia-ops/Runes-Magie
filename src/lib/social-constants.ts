/**
 * Constantes partagées du module Publications réseaux sociaux.
 * Les statuts vivent en TEXT dans la base : ces whitelists font foi côté
 * application (validation des routes + couleurs de l'interface).
 */

/** Version de l'API Graph de Meta — configurable sans redéploiement de code. */
export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v25.0';

/** Marque par défaut (multi-marques prévu : RCA, Noblio, Lapsmédia…). */
export const ORGANIZATION_ID = 'runes-et-magie';

/** Nombre maximal de tentatives de publication d'un job. */
export const MAX_TENTATIVES = 3;

/** Recul progressif entre les tentatives (minutes) : échec 1 → +10, échec 2 → +30. */
export const BACKOFF_MINUTES = [10, 30];

/** Nombre maximal d'images par publication (limite carrousel Meta). */
export const MAX_IMAGES = 10;

/** Réseaux pris en charge (Phase 1 : Facebook + Instagram). */
export const RESEAUX = ['FACEBOOK', 'INSTAGRAM'] as const;
export type Reseau = (typeof RESEAUX)[number];

export const RESEAU_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
};

/** Types de contenu — organisationnels en Phase 1 (couleur/filtre/prompt IA). */
export const TYPES_CONTENU: { value: string; label: string }[] = [
  { value: 'PUBLICATION', label: 'Publication' },
  { value: 'CARROUSEL', label: 'Carrousel' },
  { value: 'STORY', label: 'Story (publiée comme image en Phase 1)' },
  { value: 'REEL', label: 'Reel / vidéo courte (publié comme image en Phase 1)' },
  { value: 'PRODUIT', label: 'Produit de la boutique' },
  { value: 'PROMO_SOIN', label: 'Promotion d’un soin' },
  { value: 'CITATION', label: 'Citation spirituelle' },
  { value: 'PLEINE_LUNE', label: 'Pleine lune' },
  { value: 'FORMATION', label: 'Formation' },
  { value: 'EVENEMENT', label: 'Événement' },
  { value: 'TEMOIGNAGE', label: 'Témoignage client' },
];
export const TYPES_CONTENU_VALUES = TYPES_CONTENU.map((t) => t.value);

/** Statuts d'une publication + couleurs (calendrier, badges). */
export const STATUTS_POST: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  BROUILLON: { label: 'Brouillon', bg: '#E5E7EB', fg: '#374151', border: '#9CA3AF' },
  A_APPROUVER: { label: 'À approuver', bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D' },
  PROGRAMMEE: { label: 'Programmée', bg: '#DBEAFE', fg: '#1D4ED8', border: '#93C5FD' },
  PUBLIEE: { label: 'Publiée', bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7' },
  ERREUR: { label: 'Erreur', bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5' },
};
export const STATUTS_POST_VALUES = Object.keys(STATUTS_POST);

/** Statuts d'un job de publication. */
export const STATUTS_JOB: Record<string, { label: string; bg: string; fg: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#E5E7EB', fg: '#374151' },
  EN_COURS: { label: 'En cours', bg: '#DBEAFE', fg: '#1D4ED8' },
  PUBLIE: { label: 'Publié', bg: '#D1FAE5', fg: '#065F46' },
  ERREUR: { label: 'Erreur', bg: '#FEE2E2', fg: '#991B1B' },
};

/** États de connexion d'un compte. */
export const ETATS_CONNEXION: Record<string, { label: string; bg: string; fg: string }> = {
  CONNECTED: { label: 'Connecté', bg: '#D1FAE5', fg: '#065F46' },
  EXPIRED: { label: 'Jeton expiré', bg: '#FEF3C7', fg: '#92400E' },
  INVALID: { label: 'Jeton invalide', bg: '#FEE2E2', fg: '#991B1B' },
  PERMISSION_MISSING: { label: 'Permission manquante', bg: '#FEE2E2', fg: '#991B1B' },
};

/** Une image de publication (stockée dans SocialPost.images). */
export interface SocialImage {
  url: string;
  alt: string;
}

/** Déclinaison d'un texte pour un réseau (stockée dans SocialPost.variants). */
export interface SocialVariant {
  texte: string;
  hashtags: string[];
}

/** URLs d'images acceptées : uniquement le stockage public Supabase du projet. */
export const SUPABASE_PUBLIC_URL_REGEX =
  /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//;
