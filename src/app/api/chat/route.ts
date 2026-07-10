import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';
import { buildNocturaSystemPrompt, NOCTURA_OFFLINE_MESSAGE } from '@/lib/noctura-prompt';

export const dynamic = 'force-dynamic';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES_PER_CONVERSATION = 60; // 30 échanges — garde-fou anti-abus

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * POST /api/chat — un message de la visiteuse → réponse de Noctura en streaming.
 * Body : { conversationId?: string, message: string }
 * Réponse : flux texte brut (la réponse de Noctura), header `X-Conversation-Id`.
 * La conversation complète est persistée pour consultation dans l'admin.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const requestedId = typeof body?.conversationId === 'string' ? body.conversationId : null;

  if (!message) return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Message trop long (1000 caractères max).' }, { status: 400 });
  }

  // Visiteuse connectée ? (facultatif — enrichit la conversation)
  let holisticUserId: string | null = null;
  let visitorName: string | null = null;
  try {
    const session = await holisticSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = session?.user as any;
    if (u?.id && u?.role) {
      holisticUserId = u.id;
      visitorName = (u.name as string) ?? null;
    }
  } catch {
    // anonyme — parfaitement acceptable
  }

  // Charge ou crée la conversation
  let conversation =
    requestedId != null
      ? await prisma.chatConversation.findUnique({
          where: { id: requestedId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;
  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: { holisticUserId, visitorName },
      include: { messages: true },
    });
  }
  if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
    return NextResponse.json(
      { error: 'Cette conversation est très longue — rafraîchis la page pour en commencer une nouvelle. ✦' },
      { status: 429 },
    );
  }

  const conversationId = conversation.id;

  // Persiste le message de la visiteuse
  await prisma.chatMessage.create({
    data: { conversationId, role: 'user', content: message },
  });

  // IA non configurée → réponse hors-ligne propre (persistée aussi)
  if (!anthropic) {
    await prisma.chatMessage.create({
      data: { conversationId, role: 'assistant', content: NOCTURA_OFFLINE_MESSAGE },
    });
    return new Response(NOCTURA_OFFLINE_MESSAGE, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Conversation-Id': conversationId },
    });
  }

  const systemPrompt = await buildNocturaSystemPrompt();

  // Historique complet (rôles alternés user/assistant) + le nouveau message
  const history: { role: 'user' | 'assistant'; content: string }[] = [
    ...conversation.messages.map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 700,
          system: systemPrompt,
          messages: history,
        });
        for await (const event of anthropicStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error('[chat] erreur stream Anthropic', err);
        if (!fullResponse) {
          fullResponse = NOCTURA_OFFLINE_MESSAGE;
          controller.enqueue(encoder.encode(fullResponse));
        }
      } finally {
        controller.close();
        // Persistance de la réponse complète (best-effort)
        try {
          if (fullResponse) {
            await prisma.chatMessage.create({
              data: { conversationId, role: 'assistant', content: fullResponse },
            });
            // Mémoire simple : dernier soin présenté via [CARTE:slug]
            const cardMatch = fullResponse.match(/\[CARTE:([a-z0-9-]+)\]/i);
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date(), ...(cardMatch ? { lastTopic: cardMatch[1] } : {}) },
            });
          }
        } catch (err) {
          console.error('[chat] persistance réponse échouée', err);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Conversation-Id': conversationId,
    },
  });
}
