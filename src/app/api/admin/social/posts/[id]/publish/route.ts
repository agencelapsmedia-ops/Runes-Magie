import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { serialiserPost } from '@/lib/social-posts';
import { traiterJobsEchus } from '@/lib/social-publish';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INCLUDE = {
  targets: { include: { account: { select: { label: true } } } },
  jobs: true,
} as const;

/**
 * POST /api/admin/social/posts/[id]/publish — « Publier maintenant ».
 * Sert aussi de relance après ERREUR : les jobs en erreur sont remis à zéro.
 * Traitement inline → le résultat par compte est retourné immédiatement.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (post.jobs.some((j) => j.status === 'EN_COURS')) {
    return NextResponse.json({ error: 'Publication déjà en cours d’envoi — patiente un instant.' }, { status: 409 });
  }

  const ciblesActives = post.targets.filter((t) => t.enabled && t.account.isActive);
  if (ciblesActives.length === 0) {
    return NextResponse.json({ error: 'Choisis au moins un compte de publication (actif).' }, { status: 400 });
  }
  const images = Array.isArray(post.images) ? post.images : [];
  if (ciblesActives.some((t) => t.network === 'INSTAGRAM') && images.length === 0) {
    return NextResponse.json(
      { error: 'Instagram exige au moins une image — ajoute une image ou décoche Instagram.' },
      { status: 400 },
    );
  }

  // Relance : on efface les jobs en erreur pour repartir proprement.
  await prisma.socialPublishJob.deleteMany({ where: { postId: id, status: 'ERREUR' } });
  await prisma.socialPost.update({ where: { id }, data: { status: 'PROGRAMMEE', scheduledAt: new Date() } });

  const resultat = await traiterJobsEchus(ciblesActives.length, id);

  const maj = await prisma.socialPost.findUnique({ where: { id }, include: INCLUDE });
  return NextResponse.json({ resultat, post: maj ? serialiserPost(maj) : null });
}
