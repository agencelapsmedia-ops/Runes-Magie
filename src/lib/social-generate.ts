/**
 * Moteur de génération de masse — calqué sur la file de publication
 * (social-publish.ts) : verrou atomique par item, 3 tentatives maximum,
 * réanimation des items interrompus.
 *
 * Un passage traite au plus `limite` items (~15 s par item : appel Claude +
 * rendu du visuel + téléversement) pour rester loin du maxDuration de 60 s.
 * Déclencheurs : cron externe /api/cron/social-generate + relances depuis
 * l'interface (route admin /api/admin/social/batches/tick).
 */

import { prisma } from './db';
import { getOrganisation } from './organizations';
import { genererPostDepuisMatiere, iaConfiguree } from './social-ai';
import { GABARITS_VISUELS } from './social-render/registry';
import { rendreGabarit } from './social-render';
import { SERIES_CONTENU } from './social-series';
import { televerserRenduPng } from './supabase-server';

const MAX_TENTATIVES_GENERATION = 3;
const VERROU_PERIME_MINUTES = 10;

export interface ResultatGeneration {
  traites: number;
  generes: number;
  erreurs: number;
  details: { itemId: string; ok: boolean; erreur?: string }[];
}

interface ParamsBatch {
  format: string;
  accountIds: string[];
  consignes: string;
}

function lireParams(brut: unknown): ParamsBatch {
  const p = typeof brut === 'object' && brut !== null ? (brut as Record<string, unknown>) : {};
  return {
    format: typeof p.format === 'string' ? p.format : 'PORTRAIT',
    accountIds: Array.isArray(p.accountIds)
      ? p.accountIds.filter((x): x is string => typeof x === 'string')
      : [],
    consignes: typeof p.consignes === 'string' ? p.consignes : '',
  };
}

/** Génère la publication d'UN item (déjà verrouillé). */
async function genererItem(itemId: string): Promise<void> {
  const item = await prisma.contentBatchItem.findUnique({
    where: { id: itemId },
    include: { batch: true },
  });
  if (!item) throw new Error('Item introuvable.');
  const batch = item.batch;

  const org = await getOrganisation(batch.organizationId);
  if (!org) throw new Error(`Marque introuvable : ${batch.organizationId}`);

  const serie = SERIES_CONTENU.find((s) => s.cle === batch.serieKey);
  if (!serie) throw new Error(`Série inconnue : ${batch.serieKey}`);
  const gabarit = GABARITS_VISUELS.find((g) => g.cle === batch.templateKey);
  if (!gabarit) throw new Error(`Gabarit inconnu : ${batch.templateKey}`);

  const params = lireParams(batch.params);

  const source = item.sourceId
    ? await prisma.contentSource.findUnique({ where: { id: item.sourceId } })
    : null;

  const ia = await genererPostDepuisMatiere({
    marque: { nom: org.name, voix: org.charte.voix },
    serieLabel: serie.label,
    gabaritLabel: gabarit.label,
    champsGabarit: gabarit.champs.map((c) => ({ cle: c.cle, label: c.label, optionnel: c.optionnel })),
    matiere: source
      ? {
          title: source.title,
          frontmatter: (source.frontmatter ?? {}) as Record<string, unknown>,
          body: source.body,
        }
      : null,
    consignes: params.consignes,
    hashtagsMarque: org.charte.hashtagsMarque,
  });

  // Le glyphe runique vient toujours du frontmatter de la note, pas de l'IA.
  const donneesVisuel = { ...ia.visuel };
  const glyphe = source?.frontmatter && (source.frontmatter as Record<string, unknown>).glyphe;
  if (typeof glyphe === 'string' && glyphe.trim()) donneesVisuel.glyphe = glyphe.trim();

  const rendu = await rendreGabarit(batch.templateKey, params.format, donneesVisuel, org.charte, org.name);
  const url = await televerserRenduPng(rendu.png, batch.organizationId, batch.templateKey.toLowerCase());

  // Cibles : les comptes choisis à la création du lot, encore actifs.
  const comptes = params.accountIds.length
    ? await prisma.socialAccount.findMany({
        where: { id: { in: params.accountIds }, organizationId: batch.organizationId, isActive: true },
      })
    : [];

  const post = await prisma.socialPost.create({
    data: {
      organizationId: batch.organizationId,
      title: ia.titre,
      type: serie.typePost,
      baseText: ia.baseText,
      hashtags: ia.hashtags.join(' '),
      images: [{ url, alt: ia.altVisuel || ia.titre }] as unknown as object,
      variants: {
        FACEBOOK: { texte: ia.facebook.texte, hashtags: ia.facebook.hashtags },
        INSTAGRAM: { texte: ia.instagram.texte, hashtags: ia.instagram.hashtags },
      } as unknown as object,
      status: 'A_APPROUVER',
      scheduledAt: item.scheduledAt,
      batchId: batch.id,
      targets: { create: comptes.map((c) => ({ accountId: c.id, network: c.network })) },
    },
  });

  await prisma.contentBatchItem.update({
    where: { id: item.id },
    data: { status: 'GENERE', postId: post.id, lastError: null },
  });

  if (source) {
    await prisma.contentSource.update({
      where: { id: source.id },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });
  }
}

/** Clôt les lots dont tous les items sont terminés. */
async function cloturerBatches(batchIds: string[]): Promise<void> {
  for (const batchId of [...new Set(batchIds)]) {
    const [pendants, generes] = await Promise.all([
      prisma.contentBatchItem.count({
        where: { batchId, status: { in: ['EN_ATTENTE', 'EN_COURS'] } },
      }),
      prisma.contentBatchItem.count({ where: { batchId, status: 'GENERE' } }),
    ]);
    if (pendants === 0) {
      await prisma.contentBatch.updateMany({
        where: { id: batchId, status: 'EN_COURS' },
        data: { status: generes > 0 ? 'TERMINE' : 'ERREUR' },
      });
    }
  }
}

/** Traite jusqu'à `limite` items de génération échus. */
export async function traiterItemsGeneration(limite: number): Promise<ResultatGeneration> {
  const resultat: ResultatGeneration = { traites: 0, generes: 0, erreurs: 0, details: [] };
  if (!iaConfiguree()) return resultat;

  const maintenant = new Date();
  const perime = new Date(maintenant.getTime() - VERROU_PERIME_MINUTES * 60_000);

  // Réanime les items dont l'exécution a été interrompue (verrou périmé).
  const interrompus = await prisma.contentBatchItem.findMany({
    where: { status: 'EN_COURS', startedAt: { lt: perime } },
    select: { id: true, attempts: true },
  });
  for (const i of interrompus) {
    await prisma.contentBatchItem.update({
      where: { id: i.id },
      data:
        i.attempts >= MAX_TENTATIVES_GENERATION
          ? { status: 'ERREUR', lastError: 'Génération interrompue (délai dépassé).' }
          : { status: 'EN_ATTENTE', startedAt: null },
    });
  }

  // Candidats : items en attente de lots encore actifs.
  const candidats = await prisma.contentBatchItem.findMany({
    where: { status: 'EN_ATTENTE', batch: { status: 'EN_COURS' } },
    orderBy: { createdAt: 'asc' },
    take: Math.max(1, Math.min(limite, 3)),
    select: { id: true, batchId: true },
  });

  const batchesTouches: string[] = [];

  for (const candidat of candidats) {
    // Verrou atomique : seul un passage peut réclamer l'item.
    const verrou = await prisma.contentBatchItem.updateMany({
      where: { id: candidat.id, status: 'EN_ATTENTE' },
      data: { status: 'EN_COURS', startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (verrou.count === 0) continue;

    resultat.traites++;
    batchesTouches.push(candidat.batchId);

    try {
      await genererItem(candidat.id);
      resultat.generes++;
      resultat.details.push({ itemId: candidat.id, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue.';
      const item = await prisma.contentBatchItem.findUnique({
        where: { id: candidat.id },
        select: { attempts: true },
      });
      const abandonne = (item?.attempts ?? MAX_TENTATIVES_GENERATION) >= MAX_TENTATIVES_GENERATION;
      await prisma.contentBatchItem.update({
        where: { id: candidat.id },
        data: {
          status: abandonne ? 'ERREUR' : 'EN_ATTENTE',
          startedAt: null,
          lastError: message.slice(0, 1000),
        },
      });
      resultat.erreurs++;
      resultat.details.push({ itemId: candidat.id, ok: false, erreur: message });
    }
  }

  await cloturerBatches(batchesTouches);
  return resultat;
}
