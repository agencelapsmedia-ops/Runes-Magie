import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import type { SocialImage, SocialVariant } from '@/lib/social-constants';
import { genererDeclinaisons, iaConfiguree, MARQUE_IA_DEFAUT } from '@/lib/social-ai';
import { getOrganisation } from '@/lib/organizations';

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
  const post = await prisma.socialPost.findFirst({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: 'Publication introuvable — enregistre-la d’abord.' }, { status: 404 });

  const org = await getOrganisation(post.organizationId);
  const marque = org ? { nom: org.name, voix: org.charte.voix } : MARQUE_IA_DEFAUT;

  try {
    const declinaisons = await genererDeclinaisons(
      {
        title: post.title,
        type: post.type,
        baseText: post.baseText,
        callToAction: post.callToAction,
        link: post.link,
        hashtags: post.hashtags,
        images: Array.isArray(post.images) ? (post.images as unknown as SocialImage[]) : [],
        variants: (post.variants ?? {}) as unknown as Record<string, SocialVariant>,
      },
      marque,
    );
    return NextResponse.json(declinaisons);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Échec de la génération.' },
      { status: 502 },
    );
  }
}
