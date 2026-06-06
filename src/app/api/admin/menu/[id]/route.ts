import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';

/** PUT : modifier un item (libellé, URL, type, location, visibilité, onglet). */
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

    if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
    if (typeof body.href === 'string' && body.href.trim()) data.href = body.href.trim();
    if (body.type === 'PAGE' || body.type === 'CUSTOM') data.type = body.type;
    if (body.location === 'HEADER' || body.location === 'FOOTER') data.location = body.location;
    if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible;
    if (typeof body.openInNewTab === 'boolean') data.openInNewTab = body.openInNewTab;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
    }

    const item = await prisma.menuItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Erreur serveur (item introuvable ?)' }, { status: 500 });
  }
}

/** DELETE : supprimer un item. */
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
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Erreur serveur (item introuvable ?)' }, { status: 500 });
  }
}
