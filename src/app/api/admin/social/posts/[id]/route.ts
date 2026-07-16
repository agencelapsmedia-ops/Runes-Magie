import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserPost, validerImages, validerType, validerVariants } from '@/lib/social-posts';

export const dynamic = 'force-dynamic';

const INCLUDE = {
  targets: { include: { account: { select: { label: true } } } },
  jobs: true,
} as const;

async function chargerPost(id: string) {
  return prisma.socialPost.findFirst({ where: { id, organizationId: ORGANIZATION_ID }, include: INCLUDE });
}

/** GET /api/admin/social/posts/[id] — détail avec cibles et jobs. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const post = await chargerPost(id);
  if (!post) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  return NextResponse.json(serialiserPost(post));
}

/**
 * PATCH /api/admin/social/posts/[id] — modification champ par champ.
 * Le statut n'est JAMAIS accepté ici (actions dédiées). `scheduledAt` seul
 * sert au glisser-déposer du calendrier.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const existant = await chargerPost(id);
  if (!existant) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  if (existant.status === 'PUBLIEE') {
    return NextResponse.json({ error: 'Publication déjà publiée — elle ne peut plus être modifiée.' }, { status: 409 });
  }
  if (existant.jobs.some((j) => j.status === 'EN_COURS')) {
    return NextResponse.json({ error: 'Publication en cours d’envoi — réessaie dans un instant.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ('title' in body && typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if ('type' in body) data.type = validerType(body.type);
  if ('baseText' in body && typeof body.baseText === 'string') data.baseText = body.baseText;
  if ('callToAction' in body && typeof body.callToAction === 'string') data.callToAction = body.callToAction;
  if ('link' in body) data.link = typeof body.link === 'string' && body.link.trim() ? body.link.trim() : null;
  if ('hashtags' in body && typeof body.hashtags === 'string') data.hashtags = body.hashtags;
  if ('images' in body) {
    const check = validerImages(body.images);
    if (!check.ok) return NextResponse.json({ error: check.erreur }, { status: 400 });
    data.images = check.images as unknown as object;
  }
  if ('variants' in body) data.variants = validerVariants(body.variants) as unknown as object;
  if ('scheduledAt' in body) {
    if (body.scheduledAt === null) data.scheduledAt = null;
    else if (typeof body.scheduledAt === 'string' && !Number.isNaN(Date.parse(body.scheduledAt))) {
      data.scheduledAt = new Date(body.scheduledAt);
    } else {
      return NextResponse.json({ error: 'Date de programmation invalide.' }, { status: 400 });
    }
  }

  // Synchronisation des comptes ciblés
  if ('targetAccountIds' in body && Array.isArray(body.targetAccountIds)) {
    const voulus: string[] = body.targetAccountIds.filter((x: unknown): x is string => typeof x === 'string');
    const comptes = voulus.length
      ? await prisma.socialAccount.findMany({ where: { id: { in: voulus }, organizationId: ORGANIZATION_ID } })
      : [];
    const actuels = new Set(existant.targets.map((t) => t.accountId));
    const cibles = new Set(comptes.map((c) => c.id));
    const aSupprimer = [...actuels].filter((a) => !cibles.has(a));
    const aCreer = comptes.filter((c) => !actuels.has(c.id));
    await prisma.$transaction([
      prisma.socialPostTarget.deleteMany({ where: { postId: id, accountId: { in: aSupprimer } } }),
      ...aCreer.map((c) =>
        prisma.socialPostTarget.create({ data: { postId: id, accountId: c.id, network: c.network } }),
      ),
    ]);
  }

  const post = Object.keys(data).length
    ? await prisma.socialPost.update({ where: { id }, data, include: INCLUDE })
    : await chargerPost(id);

  return NextResponse.json(serialiserPost(post!));
}

/** DELETE /api/admin/social/posts/[id] — suppression (refusée si publiée). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const existant = await chargerPost(id);
  if (!existant) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  if (existant.status === 'PUBLIEE') {
    return NextResponse.json({ error: 'Publication publiée — l’historique doit rester.' }, { status: 409 });
  }

  await prisma.socialPost.delete({ where: { id } }); // cascade : cibles + jobs
  return NextResponse.json({ ok: true });
}
