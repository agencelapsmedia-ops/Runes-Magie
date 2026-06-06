import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';

/** GET : tous les items du menu (toutes locations, masqués inclus). */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST : créer un item. Body { label, href, location, type?, openInNewTab? } */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const href = typeof body.href === 'string' ? body.href.trim() : '';
    const location = body.location === 'FOOTER' ? 'FOOTER' : 'HEADER';
    const type = body.type === 'CUSTOM' ? 'CUSTOM' : 'PAGE';
    const openInNewTab = body.openInNewTab === true;

    if (!label) return NextResponse.json({ error: 'Le libellé est requis' }, { status: 400 });
    if (!href) return NextResponse.json({ error: "L'URL (href) est requise" }, { status: 400 });

    // sortOrder par défaut : max de la location + 10
    const last = await prisma.menuItem.findFirst({
      where: { location },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const item = await prisma.menuItem.create({
      data: { label, href, type, location, openInNewTab, sortOrder, isVisible: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
