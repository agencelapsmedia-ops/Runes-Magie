import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** POST /api/admin/todos/[id]/notes — ajoute une note de texte à la tâche. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content) return NextResponse.json({ error: 'La note est vide.' }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: 'Note trop longue (5000 caractères max).' }, { status: 400 });

  const task = await prisma.todoTask.findUnique({ where: { id }, select: { id: true } });
  if (!task) return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });

  const note = await prisma.todoNote.create({ data: { taskId: id, content } });
  return NextResponse.json(note, { status: 201 });
}

/** DELETE /api/admin/todos/[id]/notes?noteId=… — supprime une note. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const noteId = new URL(req.url).searchParams.get('noteId') ?? '';
  const deleted = await prisma.todoNote.deleteMany({ where: { id: noteId, taskId: id } });
  if (deleted.count === 0) return NextResponse.json({ error: 'Note introuvable.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
