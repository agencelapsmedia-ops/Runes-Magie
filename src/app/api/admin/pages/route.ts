import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { ensureSystemPages, isValidTemplate, slugify } from '@/lib/page-content';

/** GET : toutes les pages du site, ordonnées. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await ensureSystemPages();
    const pages = await prisma.sitePage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching site pages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST : créer une page à partir d'un modèle. Body { title, template, slug? } */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const template = typeof body.template === 'string' ? body.template : 'standard';

    if (!title) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 });
    if (!isValidTemplate(template)) {
      return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 });
    }

    // Slug : fourni ou dérivé du titre, rendu unique.
    const base = slugify(typeof body.slug === 'string' && body.slug.trim() ? body.slug : title) || 'page';
    let slug = base;
    let i = 2;
    while (await prisma.sitePage.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    const last = await prisma.sitePage.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const page = await prisma.sitePage.create({
      data: { title, template, slug, content: {}, sortOrder, isPublished: true },
    });
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating site page:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
