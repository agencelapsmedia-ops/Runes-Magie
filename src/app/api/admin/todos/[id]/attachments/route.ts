import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/todos/[id]/attachments — enregistre un fichier joint
 * (le fichier lui-même est téléversé côté client vers Supabase Storage).
 * Body : { name, url }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!name || !url) return NextResponse.json({ error: 'Nom et URL requis.' }, { status: 400 });
  // Seules les URLs du stockage Supabase du projet sont acceptées.
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//.test(url)) {
    return NextResponse.json({ error: 'URL de fichier invalide.' }, { status: 400 });
  }

  const task = await prisma.todoTask.findUnique({ where: { id }, select: { id: true } });
  if (!task) return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });

  const attachment = await prisma.todoAttachment.create({ data: { taskId: id, name, url } });
  return NextResponse.json(attachment, { status: 201 });
}

/** DELETE /api/admin/todos/[id]/attachments?attachmentId=… — retire un fichier joint. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const attachmentId = new URL(req.url).searchParams.get('attachmentId') ?? '';
  const deleted = await prisma.todoAttachment.deleteMany({ where: { id: attachmentId, taskId: id } });
  if (deleted.count === 0) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
