import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID, STATUTS_POST_VALUES } from '@/lib/social-constants';
import { serialiserPost, validerImages, validerType, validerVariants } from '@/lib/social-posts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/social/posts — liste des publications.
 * Filtres : ?statut=PROGRAMMEE, ?mois=2026-07 (posts programmés ce mois-là
 * OU sans date — pour la liste « À planifier » du calendrier).
 */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const statut = url.searchParams.get('statut');
  const mois = url.searchParams.get('mois'); // AAAA-MM

  const where: Record<string, unknown> = { organizationId: ORGANIZATION_ID };
  if (statut && STATUTS_POST_VALUES.includes(statut)) where.status = statut;
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const debut = new Date(`${mois}-01T00:00:00.000Z`);
    const fin = new Date(debut);
    fin.setUTCMonth(fin.getUTCMonth() + 1);
    // marge d'un mois de chaque côté pour les débordements du calendrier
    debut.setUTCMonth(debut.getUTCMonth() - 1);
    fin.setUTCMonth(fin.getUTCMonth() + 1);
    where.OR = [{ scheduledAt: { gte: debut, lt: fin } }, { scheduledAt: null }];
  }

  const posts = await prisma.socialPost.findMany({
    where,
    include: {
      targets: { include: { account: { select: { label: true } } } },
      jobs: true,
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });

  return NextResponse.json(posts.map(serialiserPost));
}

/** POST /api/admin/social/posts — création (toujours en BROUILLON). */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'Le titre interne est requis.' }, { status: 400 });

  const imagesCheck = validerImages(body.images);
  if (!imagesCheck.ok) return NextResponse.json({ error: imagesCheck.erreur }, { status: 400 });

  // Cibles : liste d'ids de comptes actifs
  const accountIds: string[] = Array.isArray(body.targetAccountIds)
    ? body.targetAccountIds.filter((x: unknown): x is string => typeof x === 'string')
    : [];
  const comptes = accountIds.length
    ? await prisma.socialAccount.findMany({ where: { id: { in: accountIds }, organizationId: ORGANIZATION_ID } })
    : [];

  const scheduledAt =
    typeof body.scheduledAt === 'string' && !Number.isNaN(Date.parse(body.scheduledAt))
      ? new Date(body.scheduledAt)
      : null;

  const post = await prisma.socialPost.create({
    data: {
      organizationId: ORGANIZATION_ID,
      title,
      type: validerType(body.type),
      baseText: typeof body.baseText === 'string' ? body.baseText : '',
      callToAction: typeof body.callToAction === 'string' ? body.callToAction : '',
      link: typeof body.link === 'string' && body.link.trim() ? body.link.trim() : null,
      hashtags: typeof body.hashtags === 'string' ? body.hashtags : '',
      images: imagesCheck.images as unknown as object,
      variants: validerVariants(body.variants) as unknown as object,
      scheduledAt, // une date sans « programmer » reste un brouillon daté
      targets: {
        create: comptes.map((c) => ({ accountId: c.id, network: c.network })),
      },
    },
    include: { targets: { include: { account: { select: { label: true } } } }, jobs: true },
  });

  return NextResponse.json(serialiserPost(post), { status: 201 });
}
