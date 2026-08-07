import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';
import { validerTuile } from '@/lib/home-tiles-validation';

/** PUT : modifier une tuile. Tous les champs sont optionnels (patch partiel). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const { data, erreur } = validerTuile(body, false);
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
    }

    const tuile = await prisma.homeTile.update({ where: { id }, data });

    // Sans cette ligne, l'accueil garderait sa version en cache jusqu'à cinq
    // minutes et la modification semblerait sans effet.
    revalidatePath('/');
    return NextResponse.json(tuile);
  } catch (error) {
    console.error('Error updating home tile:', error);
    return NextResponse.json({ error: 'Erreur serveur (tuile introuvable ?)' }, { status: 500 });
  }
}

/** DELETE : supprimer une tuile. */
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
    await prisma.homeTile.delete({ where: { id } });
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting home tile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
