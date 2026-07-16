import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserPost } from '@/lib/social-posts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social/posts/[id]/depublier — PROGRAMMEE/ERREUR → BROUILLON.
 * Retire les jobs encore en attente (ceux déjà publiés restent en historique).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const post = await prisma.socialPost.findFirst({
    where: { id, organizationId: ORGANIZATION_ID },
    include: { jobs: true },
  });
  if (!post) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  if (post.status !== 'PROGRAMMEE' && post.status !== 'ERREUR') {
    return NextResponse.json({ error: `Impossible depuis le statut « ${post.status} ».` }, { status: 409 });
  }
  if (post.jobs.some((j) => j.status === 'EN_COURS')) {
    return NextResponse.json({ error: 'Publication en cours d’envoi — réessaie dans un instant.' }, { status: 409 });
  }

  await prisma.socialPublishJob.deleteMany({ where: { postId: id, status: { in: ['EN_ATTENTE', 'ERREUR'] } } });
  const maj = await prisma.socialPost.update({
    where: { id },
    data: { status: 'BROUILLON' },
    include: { targets: { include: { account: { select: { label: true } } } }, jobs: true },
  });
  return NextResponse.json(serialiserPost(maj));
}
