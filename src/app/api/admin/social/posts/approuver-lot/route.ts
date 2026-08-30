import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { resoudreOrgId } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social/posts/approuver-lot — approbation en un clic.
 * { batchId } → toutes les publications A_APPROUVER de ce lot,
 * { organizationId } → toutes celles de la marque.
 * Mêmes exigences que « programmer » : cible active requise, image requise si
 * Instagram. Une date déjà passée (génération plus lente que prévu) est
 * repoussée au lendemain, même heure, jusqu'à retomber dans le futur.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const batchId = typeof body.batchId === 'string' && body.batchId ? body.batchId : null;
  const organizationId = await resoudreOrgId(body.organizationId);

  const posts = await prisma.socialPost.findMany({
    where: batchId ? { batchId, status: 'A_APPROUVER' } : { organizationId, status: 'A_APPROUVER' },
    include: { targets: { include: { account: true } } },
    orderBy: { scheduledAt: 'asc' },
    take: 200,
  });

  let approuves = 0;
  const ignores: { id: string; title: string; raison: string }[] = [];

  for (const post of posts) {
    const ciblesActives = post.targets.filter((t) => t.enabled && t.account.isActive);
    if (ciblesActives.length === 0) {
      ignores.push({ id: post.id, title: post.title, raison: 'aucun compte actif ciblé' });
      continue;
    }
    const images = Array.isArray(post.images) ? post.images : [];
    if (ciblesActives.some((t) => t.network === 'INSTAGRAM') && images.length === 0) {
      ignores.push({ id: post.id, title: post.title, raison: 'Instagram exige une image' });
      continue;
    }
    if (!post.scheduledAt) {
      ignores.push({ id: post.id, title: post.title, raison: 'aucune date programmée' });
      continue;
    }

    let scheduledAt = post.scheduledAt;
    while (scheduledAt.getTime() < Date.now() + 5 * 60_000) {
      scheduledAt = new Date(scheduledAt.getTime() + 24 * 60 * 60_000);
    }

    await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: 'PROGRAMMEE', scheduledAt },
    });
    approuves++;
  }

  return NextResponse.json({ approuves, ignores });
}
