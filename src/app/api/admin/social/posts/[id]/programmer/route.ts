import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserPost } from '@/lib/social-posts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social/posts/[id]/programmer — { scheduledAt }
 * Passe la publication en PROGRAMMEE (statut calculé serveur). Exigences :
 * date future, au moins une cible active, au moins une image si Instagram.
 * Les jobs sont créés au moment de l'échéance par la file de publication.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const post = await prisma.socialPost.findFirst({
    where: { id, organizationId: ORGANIZATION_ID },
    include: { targets: { include: { account: true } }, jobs: true },
  });
  if (!post) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
  if (post.status === 'PUBLIEE') {
    return NextResponse.json({ error: 'Publication déjà publiée.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const scheduledAt =
    typeof body.scheduledAt === 'string' && !Number.isNaN(Date.parse(body.scheduledAt))
      ? new Date(body.scheduledAt)
      : null;
  if (!scheduledAt) return NextResponse.json({ error: 'Date de programmation requise.' }, { status: 400 });
  if (scheduledAt.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: 'La date de programmation doit être dans le futur.' }, { status: 400 });
  }

  const ciblesActives = post.targets.filter((t) => t.enabled && t.account.isActive);
  if (ciblesActives.length === 0) {
    return NextResponse.json(
      { error: 'Choisis au moins un compte de publication (actif) avant de programmer.' },
      { status: 400 },
    );
  }
  const images = Array.isArray(post.images) ? post.images : [];
  if (ciblesActives.some((t) => t.network === 'INSTAGRAM') && images.length === 0) {
    return NextResponse.json(
      { error: 'Instagram exige au moins une image — ajoute une image ou décoche Instagram.' },
      { status: 400 },
    );
  }

  const maj = await prisma.socialPost.update({
    where: { id },
    data: { status: 'PROGRAMMEE', scheduledAt },
    include: { targets: { include: { account: { select: { label: true } } } }, jobs: true },
  });
  return NextResponse.json(serialiserPost(maj));
}
