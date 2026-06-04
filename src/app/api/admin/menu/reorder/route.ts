import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-guard';

/**
 * POST /api/admin/menu/reorder
 * Body : { orderedIds: string[] }  (les IDs d'une même location, dans l'ordre voulu)
 * Réécrit sortOrder en 10, 20, 30, … selon la position.
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds doit être un tableau non vide' }, { status: 400 });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.menuItem.update({
        where: { id: orderedIds[i] },
        data: { sortOrder: (i + 1) * 10 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering menu items:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
