import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/history?id=<conversationId>
 * Restaure l'historique d'une conversation quand la visiteuse change de page.
 * L'id (cuid stocké dans son navigateur) est non devinable — il fait office de clé.
 * On ne renvoie que les rôles et contenus, rien d'autre.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')?.trim() ?? '';
  if (!/^[a-z0-9]{20,40}$/i.test(id)) {
    return NextResponse.json({ messages: [] });
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true } } },
  });

  return NextResponse.json(
    { messages: conversation?.messages ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
