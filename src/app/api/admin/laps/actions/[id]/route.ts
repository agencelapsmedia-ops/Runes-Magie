import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

const TITRE_MAX = 200;

/** PATCH /api/admin/laps/actions/[id] — modifie une action réalisée. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 });

  const data: Record<string, unknown> = {};

  if ('title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'Le nom de l’action est requis.' }, { status: 400 });
    if (title.length > TITRE_MAX) {
      return NextResponse.json({ error: `Le nom ne peut pas dépasser ${TITRE_MAX} caractères.` }, { status: 400 });
    }
    data.title = title;
  }

  if (typeof body.description === 'string') data.description = body.description;

  if ('minutes' in body) {
    const minutes = Number(body.minutes);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      return NextResponse.json({ error: 'La durée doit être supérieure à zéro.' }, { status: 400 });
    }
    data.minutes = minutes;
  }

  if ('doneOn' in body) {
    const doneOn = body.doneOn ? new Date(body.doneOn) : null;
    if (!doneOn || Number.isNaN(doneOn.getTime())) {
      return NextResponse.json({ error: 'La date de réalisation est invalide.' }, { status: 400 });
    }
    data.doneOn = doneOn;
  }

  if (typeof body.billable === 'boolean') data.billable = body.billable;

  if ('hourlyRate' in body) {
    const taux = Number(body.hourlyRate);
    if (!Number.isFinite(taux) || taux <= 0) {
      return NextResponse.json({ error: 'Le taux horaire est invalide.' }, { status: 400 });
    }
    data.hourlyRate = taux;
  }

  if ('todoTaskId' in body) {
    if (typeof body.todoTaskId === 'string' && body.todoTaskId) {
      const tache = await prisma.todoTask.findUnique({ where: { id: body.todoTaskId }, select: { id: true } });
      data.todoTaskId = tache?.id ?? null;
    } else {
      data.todoTaskId = null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à modifier.' }, { status: 400 });
  }

  try {
    const action = await prisma.lapsAction.update({
      where: { id },
      data,
      include: { todoTask: { select: { id: true, title: true } } },
    });
    return NextResponse.json(action);
  } catch {
    return NextResponse.json({ error: 'Action introuvable.' }, { status: 404 });
  }
}

/** DELETE /api/admin/laps/actions/[id] — suppression définitive. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  try {
    await prisma.lapsAction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Action introuvable.' }, { status: 404 });
  }
}
