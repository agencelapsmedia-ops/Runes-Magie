import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** GET /api/admin/chat-conversations — liste des conversations du chat Noctura. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const conversations = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(
    conversations.map((c) => ({
      id: c.id,
      visitorName: c.visitorName,
      visitorEmail: c.visitorEmail,
      visitorPhone: c.visitorPhone,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]?.content?.slice(0, 140) ?? '',
    })),
  );
}
