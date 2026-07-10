'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ChatMsg } from './types';
import ChatLauncher from './ChatLauncher';
import ChatWindow from './ChatWindow';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import ChatComposer from './ChatComposer';

const STORAGE_KEY = 'noctura-conversation-id';

/**
 * Orchestrateur du chat Noctura : launcher + fenêtre + état de conversation.
 * Monté globalement dans le layout ; masqué sur les pages /admin.
 */
export default function NocturaChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const idSeq = useRef(0);

  useEffect(() => {
    conversationIdRef.current = localStorage.getItem(STORAGE_KEY);
  }, []);

  const nextId = () => `m${++idSeq.current}-${Date.now()}`;

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMsg = { id: nextId(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationIdRef.current ?? undefined,
          message: text,
        }),
      });

      const newConversationId = res.headers.get('X-Conversation-Id');
      if (newConversationId) {
        conversationIdRef.current = newConversationId;
        localStorage.setItem(STORAGE_KEY, newConversationId);
      }

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content: data.error ?? '✦ Un voile trouble la connexion… réessaie dans un instant.',
          },
        ]);
        return;
      }

      // Lecture du flux : la bulle de Noctura se remplit au fil de l'eau.
      const assistantId = nextId();
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: current } : m)),
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: '✦ Un voile trouble la connexion… réessaie dans un instant.' },
      ]);
    } finally {
      setTyping(false);
    }
  }, []);

  // Jamais sur l'admin (le back-office a ses propres outils)
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {!open && <ChatLauncher onOpen={() => setOpen(true)} />}
      {open && (
        <ChatWindow
          onClose={() => setOpen(false)}
          composer={<ChatComposer onSend={sendMessage} disabled={typing} />}
        >
          {messages.length === 0 && !showHandoff ? (
            <WelcomeScreen onPick={sendMessage} onHuman={() => setShowHandoff(true)} />
          ) : (
            <MessageList messages={messages} typing={typing} showHandoff={showHandoff} />
          )}
        </ChatWindow>
      )}
    </>
  );
}
