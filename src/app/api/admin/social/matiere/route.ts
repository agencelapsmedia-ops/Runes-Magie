import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { resoudreOrgId } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

const KINDS = ['RUNE', 'MYTHOLOGIE', 'PRODUIT', 'LIBRE'];

/**
 * GET /api/admin/social/matiere?org=&kind= — matière première de la marque
 * (sans le corps complet : liste pour l'interface de génération).
 */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const organizationId = await resoudreOrgId(url.searchParams.get('org'));
  const kind = url.searchParams.get('kind');

  const where: Record<string, unknown> = { organizationId, isActive: true };
  if (kind && KINDS.includes(kind)) where.kind = kind;

  const sources = await prisma.contentSource.findMany({
    where,
    select: { id: true, kind: true, slug: true, title: true, usageCount: true, lastUsedAt: true },
    orderBy: [{ kind: 'asc' }, { title: 'asc' }],
    take: 1000,
  });
  return NextResponse.json(sources);
}

/**
 * POST /api/admin/social/matiere — dépôt de matière par lot (Bearer CRON_SECRET),
 * pour les marques dont la matière vient d'un autre système que le vault.
 * Corps : { organizationId, kind, notes: [{ slug, title, body, frontmatter? }] }
 */
export async function POST(req: Request) {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const organizationId = await resoudreOrgId(body.organizationId);
  const kind = typeof body.kind === 'string' && KINDS.includes(body.kind) ? body.kind : 'LIBRE';
  const notes: unknown[] = Array.isArray(body.notes) ? body.notes.slice(0, 200) : [];

  let ecrites = 0;
  for (const brut of notes) {
    const n = typeof brut === 'object' && brut !== null ? (brut as Record<string, unknown>) : {};
    const slug = typeof n.slug === 'string' ? n.slug.trim().toLowerCase().slice(0, 80) : '';
    const title = typeof n.title === 'string' ? n.title.trim().slice(0, 200) : '';
    const corps = typeof n.body === 'string' ? n.body : '';
    if (!slug || !title || !corps) continue;
    const frontmatter =
      typeof n.frontmatter === 'object' && n.frontmatter !== null ? n.frontmatter : {};
    const checksum = createHash('sha256')
      .update(JSON.stringify({ title, frontmatter, body: corps }))
      .digest('hex');
    await prisma.contentSource.upsert({
      where: { organizationId_kind_slug: { organizationId, kind, slug } },
      update: { title, body: corps, frontmatter: JSON.parse(JSON.stringify(frontmatter)), checksum },
      create: {
        organizationId,
        kind,
        slug,
        title,
        body: corps,
        frontmatter: JSON.parse(JSON.stringify(frontmatter)),
        checksum,
      },
    });
    ecrites++;
  }

  return NextResponse.json({ ok: true, ecrites });
}
