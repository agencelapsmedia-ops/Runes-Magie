import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** GET /api/admin/chat-conversations/[id] — transcription complète d'une conversation. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  return NextResponse.json(conversation);
}

/**
 * POST /api/admin/chat-conversations/[id] — réponse humaine de Noctura/Annabelle.
 * Body : { message: string }
 * Le message est stocké avec le rôle `assistant-humain` : la visiteuse le voit
 * comme une bulle de Noctura dans son chat (au rechargement de la page), et
 * l'admin le distingue de l'IA dans la transcription.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: 'Message trop long (2000 caractères max).' }, { status: 400 });

  const conversation = await prisma.chatConversation.findUnique({ where: { id }, select: { id: true } });
  if (!conversation) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  await prisma.$transaction([
    prisma.chatMessage.create({ data: { conversationId: id, role: 'assistant-humain', content: message } }),
    prisma.chatConversation.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
