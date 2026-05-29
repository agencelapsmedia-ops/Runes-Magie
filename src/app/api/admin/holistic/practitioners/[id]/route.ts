import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function applyAction(id: string, action: string, note?: string | null) {
  if (!['approve', 'reject'].includes(action)) {
    return { error: 'Action invalide. Utilisez "approve" ou "reject".', status: 400 as const };
  }
  const practitioner = await prisma.practitioner.findUnique({ where: { id } });
  if (!practitioner) {
    return { error: 'Praticien introuvable.', status: 404 as const };
  }
  const updated = await prisma.practitioner.update({
    where: { id },
    data: {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedAt: action === 'approve' ? new Date() : null,
      adminNote: note ?? null,
    },
    include: { user: true },
  });
  return { ok: true, practitioner: updated };
}

/**
 * PUT — appel JSON depuis du JS client
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const body = await request.json() as { action: 'approve' | 'reject'; note?: string };
    const result = await applyAction(id, body.action, body.note);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, practitioner: result.practitioner });
  } catch (error) {
    console.error('[PUT /api/admin/holistic/practitioners/[id]]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

/**
 * POST — appel depuis un formulaire HTML classique (sans JS).
 * Lit les champs en formData et redirige vers la liste après succès.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const formData = await request.formData();
    const action = String(formData.get('action') ?? '');
    const note = formData.get('note') ? String(formData.get('note')) : null;

    const result = await applyAction(id, action, note);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Rafraîchit les caches et redirige vers la liste
    revalidatePath('/admin/praticiens');
    revalidatePath('/soins/praticiens');
    redirect('/admin/praticiens?tab=APPROVED');
  } catch (error) {
    // redirect() jette une exception qu'il faut laisser passer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[POST /api/admin/holistic/practitioners/[id]]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
