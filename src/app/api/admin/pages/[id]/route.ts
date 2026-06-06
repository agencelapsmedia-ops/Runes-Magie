import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { templateFields } from '@/lib/page-templates';
import { slugify } from '@/lib/page-content';

/** GET : une page par id. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const page = await prisma.sitePage.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: 'Page introuvable' }, { status: 404 });
  return NextResponse.json(page);
}

/** PUT : modifier une page (contenu, méta, titre, slug, publication). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const existing = await prisma.sitePage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Page introuvable' }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.metaTitle === 'string') data.metaTitle = body.metaTitle.trim() || null;
    if (typeof body.metaDescription === 'string') data.metaDescription = body.metaDescription.trim() || null;
    if (typeof body.isPublished === 'boolean') data.isPublished = body.isPublished;

    // Contenu : on ne garde que les clés connues du modèle (valeurs en string).
    if (body.content && typeof body.content === 'object') {
      const allowed = new Set(templateFields(existing.template).map((f) => f.key));
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(body.content as Record<string, unknown>)) {
        if (allowed.has(k) && typeof v === 'string') clean[k] = v;
      }
      data.content = clean;
    }

    // Slug : modifiable seulement pour les pages non-système, et rendu unique.
    if (!existing.isSystem && typeof body.slug === 'string' && body.slug.trim()) {
      const base = slugify(body.slug) || existing.slug;
      let slug = base;
      let i = 2;
      while (slug !== existing.slug && (await prisma.sitePage.findUnique({ where: { slug } }))) {
        slug = `${base}-${i++}`;
      }
      data.slug = slug;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
    }

    const page = await prisma.sitePage.update({ where: { id }, data });
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error updating site page:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** DELETE : supprimer une page (interdit pour les pages système). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const existing = await prisma.sitePage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Page introuvable' }, { status: 404 });
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Cette page système ne peut pas être supprimée.' }, { status: 400 });
    }
    await prisma.sitePage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site page:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
