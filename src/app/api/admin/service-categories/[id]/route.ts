import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';

/** PUT : modifier (nom, description, emoji, showOnHome, isActive, parent). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.description === 'string') data.description = body.description;
    if (typeof body.emoji === 'string') data.emoji = body.emoji.trim();
    if (typeof body.showOnHome === 'boolean') data.showOnHome = body.showOnHome;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    // Re-parentage optionnel, avec garde-fou 2 niveaux
    if (body.parentId !== undefined) {
      const newParentId: string | null = body.parentId || null;
      if (newParentId) {
        if (newParentId === id) {
          return NextResponse.json({ error: 'Une catégorie ne peut pas être sa propre parente.' }, { status: 400 });
        }
        const parent = await prisma.serviceCategory.findUnique({ where: { id: newParentId } });
        if (!parent) return NextResponse.json({ error: 'Catégorie parente introuvable' }, { status: 400 });
        if (parent.parentId) {
          return NextResponse.json({ error: 'Hiérarchie limitée à 2 niveaux.' }, { status: 400 });
        }
        const childCount = await prisma.serviceCategory.count({ where: { parentId: id } });
        if (childCount > 0) {
          return NextResponse.json(
            { error: 'Cette catégorie a des sous-catégories : elle ne peut pas devenir elle-même une sous-catégorie.' },
            { status: 400 },
          );
        }
      }
      data.parentId = newParentId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
    }

    const category = await prisma.serviceCategory.update({ where: { id }, data });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating service category:', error);
    return NextResponse.json({ error: 'Erreur serveur (catégorie introuvable ?)' }, { status: 500 });
  }
}

/** DELETE : sécurisé — bloque si sous-catégories ou services assignés. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  try {
    const childCount = await prisma.serviceCategory.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : cette catégorie a ${childCount} sous-catégorie(s). Supprime-les d'abord.` },
        { status: 409 },
      );
    }
    const offeringCount = await prisma.offering.count({ where: { categoryId: id } });
    if (offeringCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : ${offeringCount} service(s) y sont assigné(s). Réassigne-les d'abord.` },
        { status: 409 },
      );
    }
    await prisma.serviceCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service category:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
