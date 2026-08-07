import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';
import { validerTuile, slugDepuis } from '@/lib/home-tiles-validation';

/** GET : toutes les tuiles de l'accueil, ordonnées. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const tuiles = await prisma.homeTile.findMany({ orderBy: [{ sortOrder: 'asc' }] });
    return NextResponse.json(tuiles);
  } catch (error) {
    console.error('Error fetching home tiles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST : créer une tuile. */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const { data, erreur } = validerTuile(body, true);
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });

    // Slug lisible dérivé du titre, suffixé en cas de collision.
    const base = slugDepuis(String(data.title));
    let slug = base;
    for (let n = 2; await prisma.homeTile.findUnique({ where: { slug }, select: { id: true } }); n++) {
      slug = `${base}-${n}`;
    }

    const derniere = await prisma.homeTile.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const tuile = await prisma.homeTile.create({
      data: {
        ...data,
        slug,
        title: String(data.title),
        href: String(data.href),
        sortOrder: (derniere?.sortOrder ?? 0) + 10,
      },
    });

    revalidatePath('/');
    return NextResponse.json(tuile, { status: 201 });
  } catch (error) {
    console.error('Error creating home tile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
