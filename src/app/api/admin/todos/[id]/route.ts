import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

const STATUSES = ['A_FAIRE', 'EN_COURS', 'EN_VERIFICATION', 'TERMINE'];
const PRIORITIES = ['URGENTE', 'HAUTE', 'MOYENNE', 'BASSE'];

/** PATCH /api/admin/todos/[id] — met à jour (déplacement d'étape inclus) / archive. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === 'string') data.description = body.description;
  if (STATUSES.includes(body.status)) data.status = body.status;
  if (PRIORITIES.includes(body.priority)) data.priority = body.priority;
  if ('label' in body) data.label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : null;
  if ('assignee' in body) data.assignee = typeof body.assignee === 'string' && body.assignee.trim() ? body.assignee.trim() : null;
  if ('startsOn' in body) data.startsOn = body.startsOn ? new Date(body.startsOn) : null;
  if ('dueOn' in body) data.dueOn = body.dueOn ? new Date(body.dueOn) : null;
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  if ('archived' in body) data.archivedAt = body.archived ? new Date() : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à modifier.' }, { status: 400 });
  }

  // Déplacement d'étape sans ordre explicite → placé en fin de colonne.
  if (data.status && data.sortOrder === undefined) {
    const last = await prisma.todoTask.findFirst({
      where: { status: data.status as string, archivedAt: null, id: { not: id } },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    data.sortOrder = (last?.sortOrder ?? 0) + 10;
  }

  try {
    const todo = await prisma.todoTask.update({ where: { id }, data });
    return NextResponse.json(todo);
  } catch {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
  }
}

/** DELETE /api/admin/todos/[id] — suppression définitive. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  try {
    await prisma.todoTask.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
  }
}
