/**
 * File de publication Facebook / Instagram (API Graph de Meta).
 *
 * Garanties :
 * - verrou atomique par job (updateMany conditionnel) → aucune double
 *   publication même si deux exécutions se chevauchent ;
 * - recul progressif entre les tentatives (nextAttemptAt : +10 min, +30 min) ;
 * - les erreurs PERMANENTES (jeton invalide, permission manquante, image
 *   inaccessible…) ne sont JAMAIS réessayées, et l'état du compte est mis à jour ;
 * - le statut du post est recalculé après chaque job.
 *
 * Aucun jeton n'apparaît dans les messages d'erreur ni dans les logs.
 */

import { prisma } from '@/lib/db';
import { dechiffrerToken } from '@/lib/social-crypto';
import { BACKOFF_MINUTES, GRAPH_VERSION, MAX_TENTATIVES } from '@/lib/social-constants';
import { texteFinalPourReseau } from '@/lib/social-posts';
import type { SocialImage } from '@/lib/social-constants';

const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const POLL_INTERVALLE_MS = 2000;
const POLL_MAX = 12; // ~24 s de traitement de conteneur IG
const VERROU_PERIME_MIN = 15; // job EN_COURS abandonné (fonction morte en vol)

export class ErreurPublication extends Error {
  categorie: 'TEMPORAIRE' | 'PERMANENTE';
  code: string | null;
  httpStatus: number | null;
  etatCompte: string | null; // nouveau connectionStatus du compte, si applicable

  constructor(
    message: string,
    opts: { categorie: 'TEMPORAIRE' | 'PERMANENTE'; code?: string; httpStatus?: number; etatCompte?: string },
  ) {
    super(message);
    this.categorie = opts.categorie;
    this.code = opts.code ?? null;
    this.httpStatus = opts.httpStatus ?? null;
    this.etatCompte = opts.etatCompte ?? null;
  }
}

/** Classe une erreur Graph en TEMPORAIRE/PERMANENTE + état de compte. */
function classerErreurGraph(httpStatus: number, graphErr: { code?: number; error_subcode?: number; message?: string }): ErreurPublication {
  const code = graphErr.code;
  const message = (graphErr.message ?? `Erreur Meta (HTTP ${httpStatus}).`).slice(0, 500);

  if (code === 190) {
    return new ErreurPublication(message, {
      categorie: 'PERMANENTE',
      code: String(code),
      httpStatus,
      etatCompte: graphErr.error_subcode === 463 ? 'EXPIRED' : 'INVALID',
    });
  }
  if (code === 10 || (typeof code === 'number' && code >= 200 && code <= 299)) {
    return new ErreurPublication(message, {
      categorie: 'PERMANENTE',
      code: String(code),
      httpStatus,
      etatCompte: 'PERMISSION_MISSING',
    });
  }
  // Limites de débit (dont la limite Instagram de 100 publications / 24 h)
  if (code === 4 || code === 17 || code === 32 || code === 613 || code === 9) {
    const info = /publish/i.test(message) || code === 9
      ? `${message} (Instagram limite à 100 publications par période de 24 h via l'API.)`
      : message;
    return new ErreurPublication(info, { categorie: 'TEMPORAIRE', code: String(code), httpStatus });
  }
  if (httpStatus >= 500) {
    return new ErreurPublication(message, { categorie: 'TEMPORAIRE', code: code !== undefined ? String(code) : undefined, httpStatus });
  }
  return new ErreurPublication(message, { categorie: 'PERMANENTE', code: code !== undefined ? String(code) : undefined, httpStatus });
}

/** Appel Graph API (POST par défaut). Le jeton n'est jamais loggé. */
async function appelGraph(
  chemin: string,
  params: Record<string, string>,
  token: string,
  methode: 'POST' | 'GET' = 'POST',
): Promise<Record<string, unknown>> {
  const corps = new URLSearchParams({ ...params, access_token: token });
  let res: Response;
  try {
    res =
      methode === 'GET'
        ? await fetch(`${GRAPH}${chemin}?${corps.toString()}`, { signal: AbortSignal.timeout(25000) })
        : await fetch(`${GRAPH}${chemin}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: corps.toString(),
            signal: AbortSignal.timeout(25000),
          });
  } catch (e) {
    const raison = e instanceof Error && e.name === 'TimeoutError' ? 'Délai dépassé' : 'Erreur réseau';
    throw new ErreurPublication(`${raison} en joignant l'API de Meta.`, { categorie: 'TEMPORAIRE' });
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw classerErreurGraph(res.status, (data.error ?? {}) as { code?: number; error_subcode?: number; message?: string });
  }
  return data;
}

/** Vérifie qu'une image est accessible publiquement par Meta (HEAD). */
async function verifierImageAccessible(url: string, exigerJpegPng: boolean): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
  } catch {
    throw new ErreurPublication('Image inaccessible publiquement (Meta ne pourra pas la télécharger).', {
      categorie: 'PERMANENTE',
    });
  }
  if (!res.ok) {
    throw new ErreurPublication(`Image introuvable (HTTP ${res.status}) — a-t-elle été supprimée du stockage ?`, {
      categorie: 'PERMANENTE',
      httpStatus: res.status,
    });
  }
  const type = (res.headers.get('content-type') ?? '').toLowerCase();
  if (exigerJpegPng && !/image\/(jpeg|png)/.test(type)) {
    throw new ErreurPublication(
      `Format d'image « ${type || 'inconnu'} » refusé par Instagram — utilise du JPG ou du PNG.`,
      { categorie: 'PERMANENTE' },
    );
  }
}

/** Attend qu'un conteneur Instagram soit prêt (status_code = FINISHED). */
async function attendreConteneur(creationId: string, token: string): Promise<void> {
  for (let i = 0; i < POLL_MAX; i++) {
    const data = await appelGraph(`/${creationId}`, { fields: 'status_code' }, token, 'GET');
    const statut = data.status_code as string | undefined;
    if (statut === 'FINISHED') return;
    if (statut === 'ERROR') {
      throw new ErreurPublication('Meta a refusé le média (conteneur en erreur) — vérifie le format de l’image.', {
        categorie: 'PERMANENTE',
      });
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVALLE_MS));
  }
  throw new ErreurPublication('Le média est encore en traitement chez Meta — nouvel essai au prochain passage.', {
    categorie: 'TEMPORAIRE',
  });
}

/** Publie sur une Page Facebook. Retourne l'id du post créé. */
export async function publierFacebook(
  pageId: string,
  token: string,
  texte: string,
  images: SocialImage[],
  lien: string | null,
): Promise<string> {
  if (images.length === 0) {
    const params: Record<string, string> = { message: texte };
    if (lien) params.link = lien;
    const data = await appelGraph(`/${pageId}/feed`, params, token);
    return String(data.id ?? '');
  }
  if (images.length === 1) {
    const data = await appelGraph(`/${pageId}/photos`, { url: images[0].url, message: texte }, token);
    return String(data.post_id ?? data.id ?? '');
  }
  // Carrousel : photos non publiées, puis un post /feed qui les attache.
  const mediaIds: string[] = [];
  for (const img of images) {
    const data = await appelGraph(`/${pageId}/photos`, { url: img.url, published: 'false' }, token);
    mediaIds.push(String(data.id));
  }
  const params: Record<string, string> = { message: texte };
  mediaIds.forEach((id, i) => {
    params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });
  const data = await appelGraph(`/${pageId}/feed`, params, token);
  return String(data.id ?? '');
}

/** Publie sur un compte Instagram Business. Retourne l'id du média publié. */
export async function publierInstagram(
  igUserId: string,
  token: string,
  texte: string,
  images: SocialImage[],
): Promise<string> {
  if (images.length === 0) {
    throw new ErreurPublication('Instagram exige au moins une image.', { categorie: 'PERMANENTE' });
  }
  for (const img of images) {
    await verifierImageAccessible(img.url, true);
  }

  let creationId: string;
  if (images.length === 1) {
    const data = await appelGraph(`/${igUserId}/media`, { image_url: images[0].url, caption: texte }, token);
    creationId = String(data.id);
  } else {
    const enfants: string[] = [];
    for (const img of images) {
      const data = await appelGraph(`/${igUserId}/media`, { image_url: img.url, is_carousel_item: 'true' }, token);
      const enfantId = String(data.id);
      await attendreConteneur(enfantId, token);
      enfants.push(enfantId);
    }
    const data = await appelGraph(
      `/${igUserId}/media`,
      { media_type: 'CAROUSEL', children: enfants.join(','), caption: texte },
      token,
    );
    creationId = String(data.id);
  }

  await attendreConteneur(creationId, token);
  const publie = await appelGraph(`/${igUserId}/media_publish`, { creation_id: creationId }, token);
  return String(publie.id ?? '');
}

/** Crée les jobs EN_ATTENTE manquants pour un post (idempotent). */
export async function creerJobsPourPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { targets: { include: { account: true } }, jobs: true },
  });
  if (!post) return;

  const existants = new Set(post.jobs.map((j) => j.accountId));
  for (const cible of post.targets) {
    if (!cible.enabled || existants.has(cible.accountId)) continue;
    try {
      await prisma.socialPublishJob.create({
        data: {
          organizationId: post.organizationId,
          postId: post.id,
          accountId: cible.accountId,
          network: cible.network,
          ...(cible.account.isActive
            ? {}
            : {
                status: 'ERREUR',
                errorCategory: 'PERMANENTE',
                lastError: 'Compte désactivé — réactive-le puis relance la publication.',
              }),
        },
      });
    } catch (e) {
      // P2002 = créé en parallèle par une autre exécution : sans conséquence.
      if (!(typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002')) throw e;
    }
  }
}

/** Recalcule le statut du post selon l'état de ses jobs. */
export async function recalculerStatutPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUnique({ where: { id: postId }, include: { jobs: true } });
  if (!post || post.jobs.length === 0) return;

  const tousPublies = post.jobs.every((j) => j.status === 'PUBLIE');
  const resteActif = post.jobs.some((j) => j.status === 'EN_ATTENTE' || j.status === 'EN_COURS');
  const auMoinsUneErreur = post.jobs.some((j) => j.status === 'ERREUR');

  let statut = post.status;
  let publishedAt = post.publishedAt;
  if (tousPublies) {
    statut = 'PUBLIEE';
    publishedAt = publishedAt ?? new Date();
  } else if (!resteActif && auMoinsUneErreur) {
    statut = 'ERREUR';
  }
  if (statut !== post.status || publishedAt !== post.publishedAt) {
    await prisma.socialPost.update({ where: { id: postId }, data: { status: statut, publishedAt } });
  }
}

/** Traite UN job déjà verrouillé (statut EN_COURS). */
async function executerJob(jobId: string): Promise<{ ok: boolean; erreur?: string }> {
  const job = await prisma.socialPublishJob.findUnique({
    where: { id: jobId },
    include: { account: true, post: true },
  });
  if (!job) return { ok: false, erreur: 'Job introuvable.' };

  try {
    const token = dechiffrerToken(job.account.encryptedAccessToken);
    const texte = texteFinalPourReseau(job.post, job.network);
    const images = Array.isArray(job.post.images) ? (job.post.images as unknown as SocialImage[]) : [];

    const externalPostId =
      job.network === 'INSTAGRAM'
        ? await publierInstagram(job.account.externalId, token, texte, images)
        : await publierFacebook(job.account.externalId, token, texte, images, job.post.link);

    await prisma.socialPublishJob.update({
      where: { id: job.id },
      data: {
        status: 'PUBLIE',
        externalPostId,
        publishedAt: new Date(),
        lastError: null,
        errorCode: null,
        errorCategory: null,
        lastHttpStatus: null,
        nextAttemptAt: null,
      },
    });
    return { ok: true };
  } catch (e) {
    const err =
      e instanceof ErreurPublication
        ? e
        : new ErreurPublication(e instanceof Error ? e.message.slice(0, 500) : 'Erreur inattendue.', {
            categorie: 'PERMANENTE',
          });

    const definitif = err.categorie === 'PERMANENTE' || job.attempts >= MAX_TENTATIVES;
    const backoffMin = BACKOFF_MINUTES[Math.min(job.attempts - 1, BACKOFF_MINUTES.length - 1)] ?? 30;

    await prisma.socialPublishJob.update({
      where: { id: job.id },
      data: {
        status: definitif ? 'ERREUR' : 'EN_ATTENTE',
        nextAttemptAt: definitif ? null : new Date(Date.now() + backoffMin * 60_000),
        lastError: err.message,
        errorCode: err.code,
        errorCategory: err.categorie,
        lastHttpStatus: err.httpStatus,
      },
    });

    // Jeton invalide / permission manquante → refléter l'état sur le compte.
    if (err.etatCompte) {
      await prisma.socialAccount.update({
        where: { id: job.accountId },
        data: { connectionStatus: err.etatCompte, lastTestSucceeded: false, lastTestError: err.message },
      });
    }
    return { ok: false, erreur: err.message };
  }
}

/** Verrouille puis exécute un job. Retourne null si une autre exécution l'a pris. */
async function verrouillerEtExecuter(jobId: string): Promise<{ ok: boolean; erreur?: string } | null> {
  const verrou = await prisma.socialPublishJob.updateMany({
    where: { id: jobId, status: 'EN_ATTENTE', attempts: { lt: MAX_TENTATIVES } },
    data: { status: 'EN_COURS', startedAt: new Date(), attempts: { increment: 1 } },
  });
  if (verrou.count !== 1) return null;
  return executerJob(jobId);
}

/**
 * Traite les publications échues : crée les jobs manquants, réanime les
 * verrous périmés, exécute jusqu'à `limite` jobs. Utilisé par le cron ET
 * par « Publier maintenant » (via postId).
 */
export async function traiterJobsEchus(limite = 8, postId?: string): Promise<{
  jobsTraites: number;
  publies: number;
  erreurs: number;
  details: { jobId: string; ok: boolean; erreur?: string }[];
}> {
  const maintenant = new Date();

  // 1. Jobs manquants pour les posts programmés échus
  const postsEchus = await prisma.socialPost.findMany({
    where: {
      status: 'PROGRAMMEE',
      scheduledAt: { lte: maintenant },
      ...(postId ? { id: postId } : {}),
    },
    select: { id: true },
  });
  for (const p of postsEchus) await creerJobsPourPost(p.id);

  // 2. Réanimation des jobs EN_COURS abandonnés (fonction interrompue)
  const perime = new Date(Date.now() - VERROU_PERIME_MIN * 60_000);
  await prisma.socialPublishJob.updateMany({
    where: { status: 'EN_COURS', startedAt: { lt: perime }, attempts: { lt: MAX_TENTATIVES } },
    data: { status: 'EN_ATTENTE', nextAttemptAt: null },
  });
  await prisma.socialPublishJob.updateMany({
    where: { status: 'EN_COURS', startedAt: { lt: perime }, attempts: { gte: MAX_TENTATIVES } },
    data: { status: 'ERREUR', errorCategory: 'TEMPORAIRE', lastError: 'Interrompu (délai dépassé).' },
  });

  // 3. Sélection des jobs prêts
  const jobs = await prisma.socialPublishJob.findMany({
    where: {
      status: 'EN_ATTENTE',
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: maintenant } }],
      post: { status: 'PROGRAMMEE', scheduledAt: { lte: maintenant } },
      ...(postId ? { postId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: limite,
    select: { id: true, postId: true },
  });

  const details: { jobId: string; ok: boolean; erreur?: string }[] = [];
  const postsTouches = new Set<string>();
  for (const j of jobs) {
    const resultat = await verrouillerEtExecuter(j.id);
    if (resultat === null) continue; // pris par une autre exécution
    details.push({ jobId: j.id, ...resultat });
    postsTouches.add(j.postId);
  }
  for (const id of postsTouches) await recalculerStatutPost(id);

  return {
    jobsTraites: details.length,
    publies: details.filter((d) => d.ok).length,
    erreurs: details.filter((d) => !d.ok).length,
    details,
  };
}
