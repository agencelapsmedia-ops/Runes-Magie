import { NextResponse } from 'next/server';
import { fromZonedTime } from 'date-fns-tz';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { resoudreOrgId } from '@/lib/organizations';
import { GABARITS_VISUELS_CLES } from '@/lib/social-render/registry';
import { SERIES_CONTENU } from '@/lib/social-series';

export const dynamic = 'force-dynamic';

const FUSEAU = 'America/Toronto';
const QUANTITE_MAX = 60;

export interface BatchSerialise {
  id: string;
  organizationId: string;
  title: string;
  serieKey: string;
  templateKey: string;
  quantite: number;
  status: string;
  createdAt: string;
  progression: { enAttente: number; enCours: number; generes: number; erreurs: number };
}

async function serialiserBatches(batches: { id: string }[]): Promise<Map<string, BatchSerialise['progression']>> {
  const comptes = await prisma.contentBatchItem.groupBy({
    by: ['batchId', 'status'],
    where: { batchId: { in: batches.map((b) => b.id) } },
    _count: { _all: true },
  });
  const progression = new Map<string, BatchSerialise['progression']>();
  for (const b of batches) progression.set(b.id, { enAttente: 0, enCours: 0, generes: 0, erreurs: 0 });
  for (const c of comptes) {
    const p = progression.get(c.batchId);
    if (!p) continue;
    if (c.status === 'EN_ATTENTE') p.enAttente = c._count._all;
    else if (c.status === 'EN_COURS') p.enCours = c._count._all;
    else if (c.status === 'GENERE') p.generes = c._count._all;
    else if (c.status === 'ERREUR') p.erreurs = c._count._all;
  }
  return progression;
}

/** GET /api/admin/social/batches?org= — lots récents avec progression. */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const organizationId = await resoudreOrgId(new URL(req.url).searchParams.get('org'));
  const batches = await prisma.contentBatch.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const progression = await serialiserBatches(batches);

  return NextResponse.json(
    batches.map((b) => ({
      id: b.id,
      organizationId: b.organizationId,
      title: b.title,
      serieKey: b.serieKey,
      templateKey: b.templateKey,
      quantite: b.quantite,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      progression: progression.get(b.id),
    })),
  );
}

/**
 * POST /api/admin/social/batches — crée un lot de génération.
 * { organizationId, serieKey, templateKey, format, quantite, dateDebut (AAAA-MM-JJ),
 *   heureLocale (HH:mm, heure de Montréal), cadenceJours, accountIds, consignes? }
 * La création est instantanée : les items sont générés en tâche de fond.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const organizationId = await resoudreOrgId(body.organizationId);

  const serie = SERIES_CONTENU.find((s) => s.cle === body.serieKey);
  if (!serie) return NextResponse.json({ error: 'Série inconnue.' }, { status: 400 });

  const templateKey =
    typeof body.templateKey === 'string' && GABARITS_VISUELS_CLES.includes(body.templateKey)
      ? body.templateKey
      : serie.templateDefaut;

  const quantite = Number(body.quantite);
  if (!Number.isInteger(quantite) || quantite < 1 || quantite > QUANTITE_MAX) {
    return NextResponse.json({ error: `Quantité invalide (1 à ${QUANTITE_MAX}).` }, { status: 400 });
  }

  const dateDebut = typeof body.dateDebut === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dateDebut)
    ? body.dateDebut
    : null;
  const heureLocale = typeof body.heureLocale === 'string' && /^\d{2}:\d{2}$/.test(body.heureLocale)
    ? body.heureLocale
    : '18:00';
  if (!dateDebut) return NextResponse.json({ error: 'Date de début requise (AAAA-MM-JJ).' }, { status: 400 });

  const cadenceJours = Number(body.cadenceJours);
  if (!Number.isInteger(cadenceJours) || cadenceJours < 1 || cadenceJours > 30) {
    return NextResponse.json({ error: 'Cadence invalide (1 à 30 jours).' }, { status: 400 });
  }

  const consignes = typeof body.consignes === 'string' ? body.consignes.slice(0, 2000) : '';
  if (serie.kinds.length === 0 && !consignes.trim()) {
    return NextResponse.json(
      { error: `La série « ${serie.label} » a besoin de consignes.` },
      { status: 400 },
    );
  }

  // Comptes cibles (de la même marque).
  const accountIds: string[] = Array.isArray(body.accountIds)
    ? body.accountIds.filter((x: unknown): x is string => typeof x === 'string')
    : [];
  const comptes = accountIds.length
    ? await prisma.socialAccount.findMany({ where: { id: { in: accountIds }, organizationId, isActive: true } })
    : [];

  // Rotation de la matière : les notes les moins utilisées d'abord, en cycle.
  let sourceIds: (string | null)[] = new Array(quantite).fill(null);
  if (serie.kinds.length > 0) {
    const sources = await prisma.contentSource.findMany({
      where: { organizationId, kind: { in: serie.kinds }, isActive: true },
      orderBy: [{ usageCount: 'asc' }, { lastUsedAt: { sort: 'asc', nulls: 'first' } }],
      select: { id: true },
    });
    if (sources.length === 0) {
      return NextResponse.json(
        { error: `Aucune matière première (${serie.kinds.join(', ')}) pour cette marque — importe le corpus d'abord.` },
        { status: 400 },
      );
    }
    sourceIds = Array.from({ length: quantite }, (_, i) => sources[i % sources.length].id);
  }

  // Étalement des dates : jour par jour en heure de Montréal (stable malgré les
  // changements d'heure : la date locale est recomposée à chaque item).
  const [annee, mois, jour] = dateDebut.split('-').map(Number);
  const dates = Array.from({ length: quantite }, (_, i) => {
    const jourLocal = new Date(Date.UTC(annee, mois - 1, jour + i * cadenceJours))
      .toISOString()
      .slice(0, 10);
    return fromZonedTime(`${jourLocal}T${heureLocale}:00`, FUSEAU);
  });

  const titre =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : `${serie.label} × ${quantite}`;

  const batch = await prisma.contentBatch.create({
    data: {
      organizationId,
      title: titre,
      serieKey: serie.cle,
      templateKey,
      quantite,
      params: {
        format: typeof body.format === 'string' ? body.format : 'PORTRAIT',
        heureLocale,
        cadenceJours,
        dateDebut,
        accountIds: comptes.map((c) => c.id),
        consignes,
      },
      items: {
        create: dates.map((scheduledAt, i) => ({ scheduledAt, sourceId: sourceIds[i] })),
      },
    },
  });

  return NextResponse.json(
    { id: batch.id, title: batch.title, quantite, status: batch.status },
    { status: 201 },
  );
}
