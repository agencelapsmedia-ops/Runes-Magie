import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** GET /api/admin/social/batches/[id] — détail d'un lot avec ses items. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const batch = await prisma.contentBatch.findUnique({
    where: { id },
    include: { items: { orderBy: { scheduledAt: 'asc' } } },
  });
  if (!batch) return NextResponse.json({ error: 'Lot introuvable.' }, { status: 404 });

  return NextResponse.json({
    id: batch.id,
    organizationId: batch.organizationId,
    title: batch.title,
    serieKey: batch.serieKey,
    templateKey: batch.templateKey,
    quantite: batch.quantite,
    status: batch.status,
    createdAt: batch.createdAt.toISOString(),
    items: batch.items.map((i) => ({
      id: i.id,
      status: i.status,
      scheduledAt: i.scheduledAt.toISOString(),
      attempts: i.attempts,
      lastError: i.lastError,
      postId: i.postId,
    })),
  });
}

/**
 * DELETE /api/admin/social/batches/[id] — annule un lot en cours.
 * Les publications déjà générées restent (en A_APPROUVER) ; seuls les items
 * pas encore générés sont abandonnés.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const batch = await prisma.contentBatch.findUnique({ where: { id } });
  if (!batch) return NextResponse.json({ error: 'Lot introuvable.' }, { status: 404 });
  if (batch.status !== 'EN_COURS') {
    return NextResponse.json({ error: 'Ce lot n’est plus en cours.' }, { status: 409 });
  }

  await prisma.contentBatch.update({ where: { id }, data: { status: 'ANNULE' } });
  return NextResponse.json({ ok: true });
}
