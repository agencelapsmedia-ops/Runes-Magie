import Link from 'next/link';
import { prisma } from '@/lib/db';

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
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: m.role === 'user' ? '#6B3FA0' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {m.role === 'user' ? 'Visiteuse' : 'Noctura'} · {formatDate(m.createdAt)}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.92rem', color: '#1F2937', whiteSpace: 'pre-line', lineHeight: 1.55 }}>
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
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
        <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Date', 'Visiteuse', 'Messages', 'Dernier message', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conversations.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(c.updatedAt)}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#2D1B4E', fontWeight: 600 }}>
                    {c.visitorName || 'Anonyme'}
                    {c.visitorEmail && <span style={{ display: 'block', fontWeight: 400, color: '#6B7280', fontSize: '0.78rem' }}>{c.visitorEmail}</span>}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#374151' }}>{c._count.messages}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#6B7280', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.messages[0]?.content ?? '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Link
                      href={`/admin/conversations?id=${c.id}`}
                      style={{ padding: '6px 14px', background: '#6B3FA0', color: '#FFF', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Lire
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
