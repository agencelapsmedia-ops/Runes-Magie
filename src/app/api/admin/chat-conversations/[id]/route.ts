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
