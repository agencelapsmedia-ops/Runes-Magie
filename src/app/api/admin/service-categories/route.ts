import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';
import { slugify } from '@/lib/utils';
import { getServiceCategoryTree } from '@/lib/service-categories';

/** GET : arbre des catégories (1er niveau → sous-catégories) + compteurs. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const tree = await getServiceCategoryTree();
    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST : créer une catégorie ou sous-catégorie. Body { name, parentId?, description?, emoji?, showOnHome? } */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });

    const parentId = typeof body.parentId === 'string' && body.parentId ? body.parentId : null;
    if (parentId) {
      const parent = await prisma.serviceCategory.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ error: 'Catégorie parente introuvable' }, { status: 400 });
      if (parent.parentId) {
        return NextResponse.json(
          { error: 'Hiérarchie limitée à 2 niveaux : une sous-catégorie ne peut pas avoir de sous-catégorie.' },
          { status: 400 },
        );
      }
    }

    // Slug unique
    const baseSlug = slugify(name) || 'categorie';
    let slug = baseSlug;
    let i = 2;
    while (await prisma.serviceCategory.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    // sortOrder = max du groupe (même parent) + 10
    const last = await prisma.serviceCategory.findFirst({
      where: { parentId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        slug,
        description: typeof body.description === 'string' ? body.description : '',
        emoji: typeof body.emoji === 'string' ? body.emoji.trim() : '',
        parentId,
        sortOrder,
        showOnHome: body.showOnHome === true,
        isActive: true,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating service category:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
