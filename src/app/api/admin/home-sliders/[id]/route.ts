import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';

/** PUT : modifier un slider (titre, catégories, visibilité). */
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
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (Array.isArray(body.categoryIds)) {
      data.categoryIds = body.categoryIds.filter((x: unknown): x is string => typeof x === 'string');
    }
    if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
    }

    const slider = await prisma.homeSlider.update({ where: { id }, data });
    return NextResponse.json(slider);
  } catch (error) {
    console.error('Error updating home slider:', error);
    return NextResponse.json({ error: 'Erreur serveur (slider introuvable ?)' }, { status: 500 });
  }
}

/** DELETE : supprimer un slider. */
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
    await prisma.homeSlider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting home slider:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
