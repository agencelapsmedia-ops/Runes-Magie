import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';

/** GET : tous les sliders de l'accueil, ordonnés. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const sliders = await prisma.homeSlider.findMany({ orderBy: [{ sortOrder: 'asc' }] });
    return NextResponse.json(sliders);
  } catch (error) {
    console.error('Error fetching home sliders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST : créer un slider. Body { title, categoryIds?: string[], isVisible? } */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 });

    const categoryIds: string[] = Array.isArray(body.categoryIds)
      ? body.categoryIds.filter((x: unknown): x is string => typeof x === 'string')
      : [];

    const last = await prisma.homeSlider.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const slider = await prisma.homeSlider.create({
      data: { title, categoryIds, sortOrder, isVisible: true },
    });
    return NextResponse.json(slider, { status: 201 });
  } catch (error) {
    console.error('Error creating home slider:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
