/**
 * Aides serveur pour les publications réseaux sociaux : validation des champs
 * et sérialisation (dates ISO, cibles, jobs) pour l'admin.
 *
 * Le STATUT d'une publication n'est jamais accepté du client : il est calculé
 * par les actions serveur (programmer/approbation/depublier/publish) et par la
 * file de publication.
 */

import {
  MAX_IMAGES,
  SUPABASE_PUBLIC_URL_REGEX,
  TYPES_CONTENU_VALUES,
  type SocialImage,
  type SocialVariant,
} from '@/lib/social-constants';

export interface PostSerialise {
  id: string;
  title: string;
  type: string;
  baseText: string;
  callToAction: string;
  link: string | null;
  hashtags: string;
  images: SocialImage[];
  variants: Record<string, SocialVariant>;
  complianceReport: unknown;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  targets: { id: string; accountId: string; network: string; enabled: boolean; accountLabel?: string }[];
  jobs: {
    id: string;
    accountId: string;
    network: string;
    status: string;
    attempts: number;
    errorCategory: string | null;
    lastError: string | null;
    externalPostId: string | null;
    publishedAt: string | null;
  }[];
}

type PostAvecRelations = {
  id: string;
  title: string;
  type: string;
  baseText: string;
  callToAction: string;
  link: string | null;
  hashtags: string;
  images: unknown;
  variants: unknown;
  complianceReport: unknown;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  targets?: { id: string; accountId: string; network: string; enabled: boolean; account?: { label: string } }[];
  jobs?: {
    id: string;
    accountId: string;
    network: string;
    status: string;
    attempts: number;
    errorCategory: string | null;
    lastError: string | null;
    externalPostId: string | null;
    publishedAt: Date | null;
  }[];
};

export function serialiserPost(p: PostAvecRelations): PostSerialise {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    baseText: p.baseText,
    callToAction: p.callToAction,
    link: p.link,
    hashtags: p.hashtags,
    images: Array.isArray(p.images) ? (p.images as SocialImage[]) : [],
    variants:
      p.variants && typeof p.variants === 'object' && !Array.isArray(p.variants)
        ? (p.variants as Record<string, SocialVariant>)
        : {},
    complianceReport: p.complianceReport ?? null,
    status: p.status,
    scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    targets: (p.targets ?? []).map((t) => ({
      id: t.id,
      accountId: t.accountId,
      network: t.network,
      enabled: t.enabled,
      accountLabel: t.account?.label,
    })),
    jobs: (p.jobs ?? []).map((j) => ({
      id: j.id,
      accountId: j.accountId,
      network: j.network,
      status: j.status,
      attempts: j.attempts,
      errorCategory: j.errorCategory,
      lastError: j.lastError,
      externalPostId: j.externalPostId,
      publishedAt: j.publishedAt ? j.publishedAt.toISOString() : null,
    })),
  };
}

/** Valide et normalise le tableau d'images reçu du client. */
export function validerImages(brut: unknown): { ok: true; images: SocialImage[] } | { ok: false; erreur: string } {
  if (brut === undefined) return { ok: true, images: [] };
  if (!Array.isArray(brut)) return { ok: false, erreur: 'Format des images invalide.' };
  if (brut.length > MAX_IMAGES) return { ok: false, erreur: `Maximum ${MAX_IMAGES} images par publication.` };
  const images: SocialImage[] = [];
  for (const item of brut) {
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    const alt = typeof item?.alt === 'string' ? item.alt.trim() : '';
    if (!SUPABASE_PUBLIC_URL_REGEX.test(url)) {
      return { ok: false, erreur: 'URL d’image invalide (seul le stockage du site est accepté).' };
    }
    images.push({ url, alt });
  }
  return { ok: true, images };
}

/** Valide et normalise les déclinaisons par réseau. */
export function validerVariants(brut: unknown): Record<string, SocialVariant> {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {};
  const variants: Record<string, SocialVariant> = {};
  for (const [reseau, v] of Object.entries(brut as Record<string, unknown>)) {
    const texte = typeof (v as { texte?: unknown })?.texte === 'string' ? ((v as { texte: string }).texte) : '';
    const hashtagsBruts = (v as { hashtags?: unknown })?.hashtags;
    const hashtags = Array.isArray(hashtagsBruts) ? hashtagsBruts.filter((h): h is string => typeof h === 'string') : [];
    variants[reseau.toUpperCase()] = { texte, hashtags };
  }
  return variants;
}

/** Valide le type de contenu (repli : PUBLICATION). */
export function validerType(brut: unknown): string {
  return typeof brut === 'string' && TYPES_CONTENU_VALUES.includes(brut) ? brut : 'PUBLICATION';
}

/** Construit le texte final publié pour un réseau (déclinaison ou contenu de base). */
export function texteFinalPourReseau(post: {
  baseText: string;
  callToAction: string;
  link: string | null;
  hashtags: string;
  variants: unknown;
}, reseau: string): string {
  const variants =
    post.variants && typeof post.variants === 'object' && !Array.isArray(post.variants)
      ? (post.variants as Record<string, SocialVariant>)
      : {};
  const v = variants[reseau];
  if (v?.texte?.trim()) {
    const tags = (v.hashtags ?? []).join(' ').trim();
    return tags ? `${v.texte.trim()}\n\n${tags}` : v.texte.trim();
  }
  const morceaux = [post.baseText.trim(), post.callToAction.trim(), post.link?.trim() ?? '', post.hashtags.trim()];
  return morceaux.filter(Boolean).join('\n\n');
}
