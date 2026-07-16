import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserPost } from '@/lib/social-posts';

export const dynamic = 'force-dynamic';

/** POST /api/admin/social/posts/[id]/approbation — BROUILLON → A_APPROUVER (et retour). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const post = await prisma.socialPost.findFirst({ where: { id, organizationId: ORGANIZATION_ID } });
  if (!post) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  if (post.status !== 'BROUILLON' && post.status !== 'A_APPROUVER') {
    return NextResponse.json({ error: `Impossible depuis le statut « ${post.status} ».` }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const retour = body?.retour === true; // retour vers BROUILLON

  const maj = await prisma.socialPost.update({
    where: { id },
    data: { status: retour ? 'BROUILLON' : 'A_APPROUVER' },
    include: { targets: { include: { account: { select: { label: true } } } }, jobs: true },
  });
  return NextResponse.json(serialiserPost(maj));
}
