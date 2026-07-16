import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID, type SocialImage, type SocialVariant } from '@/lib/social-constants';
import { genererDeclinaisons, iaConfiguree } from '@/lib/social-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** POST /api/admin/social/ia/variantes — { postId } → déclinaisons FB/IG + hashtags + alt. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  if (!iaConfiguree()) {
    return NextResponse.json({ error: "L'IA n'est pas configurée (ANTHROPIC_API_KEY absente)." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const postId = typeof body.postId === 'string' ? body.postId : '';
  const post = await prisma.socialPost.findFirst({ where: { id: postId, organizationId: ORGANIZATION_ID } });
  if (!post) return NextResponse.json({ error: 'Publication introuvable — enregistre-la d’abord.' }, { status: 404 });

  try {
    const declinaisons = await genererDeclinaisons({
      title: post.title,
      type: post.type,
      baseText: post.baseText,
      callToAction: post.callToAction,
      link: post.link,
      hashtags: post.hashtags,
      images: Array.isArray(post.images) ? (post.images as unknown as SocialImage[]) : [],
      variants: (post.variants ?? {}) as unknown as Record<string, SocialVariant>,
    });
    return NextResponse.json(declinaisons);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Échec de la génération.' },
      { status: 502 },
    );
  }
}
