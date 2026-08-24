import Link from 'next/link';
import { prisma } from '@/lib/db';
import ReplyBox from './ReplyBox';

export const dynamic = 'force-dynamic';

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Conversations du chat Noctura : liste + transcription complète (?id=...).
 * Lecture directe Prisma (même pattern que /admin/consultations).
 */
export default async function ConversationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // ── Vue transcription ──
  if (id) {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return (
      <div style={{ fontFamily: 'sans-serif', maxWidth: '780px' }}>
        <Link
          href="/admin/conversations"
          style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B3FA0', textDecoration: 'none' }}
        >
          ← Toutes les conversations
        </Link>
        {!conversation ? (
          <p style={{ marginTop: '20px', color: '#6B7280' }}>Conversation introuvable.</p>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.5rem', fontWeight: 700, color: '#2D1B4E', margin: '12px 0 4px' }}>
              Conversation du {formatDate(conversation.createdAt)}
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '24px' }}>
              {conversation.visitorName || 'Visiteuse anonyme'}
              {conversation.visitorEmail ? ` · ${conversation.visitorEmail}` : ''}
              {conversation.visitorPhone ? ` · ${conversation.visitorPhone}` : ''}
              {' · '}{conversation.messages.length} message{conversation.messages.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {conversation.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: m.role === 'user' ? '#EDE9FE' : '#FFFFFF',
                    border: `1px solid ${m.role === 'user' ? '#C4B5FD' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: m.role === 'user' ? '#6B3FA0' : m.role === 'assistant-humain' ? '#166534' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {m.role === 'user' ? 'Visiteuse' : m.role === 'assistant-humain' ? 'Toi (réponse humaine)' : 'Noctura (IA)'} · {formatDate(m.createdAt)}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.92rem', color: '#1F2937', whiteSpace: 'pre-line', lineHeight: 1.55 }}>
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
            <ReplyBox conversationId={conversation.id} />
          </>
        )}
      </div>
    );
  }

  // ── Vue liste ──
  const conversations = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛜ Conversations du chat
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Tout ce que les visiteuses ont échangé avec Noctura sur le site.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '40px', textAlign: 'center', color: '#6B7280' }}>
          Aucune conversation pour l&apos;instant — le chat vient d&apos;ouvrir ses portes. ✦
        </div>
      ) : (
        /* Cartes empilées (responsive) : le tableau débordait sur téléphone —
           chaque conversation est maintenant une carte cliquable, style boîte
           de réception, lisible sur toutes les tailles d'écran. */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/admin/conversations?id=${c.id}`}
              style={{
                display: 'block',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                padding: '14px 16px',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2D1B4E' }}>
                  {c.visitorName || 'Anonyme'}
                  <span style={{ marginLeft: '8px', padding: '1px 8px', borderRadius: '999px', background: 'rgba(107,63,160,0.1)', color: '#6B3FA0', fontSize: '0.72rem', fontWeight: 600 }}>
                    {c._count.messages} msg
                  </span>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{formatDate(c.updatedAt)}</span>
              </div>
              {c.visitorEmail && (
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>{c.visitorEmail}</p>
              )}
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '0.85rem',
                  color: '#6B7280',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {c.messages[0]?.content ?? '—'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
