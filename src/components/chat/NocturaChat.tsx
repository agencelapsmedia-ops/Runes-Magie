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
const OPEN_KEY = 'noctura-open'; // sessionStorage : le chat reste ouvert d'une page à l'autre

/**
 * Orchestrateur du chat Noctura : launcher + fenêtre + état de conversation.
 * Monté globalement dans le layout ; masqué sur les pages /admin.
 * La conversation SURVIT aux changements de page : l'historique est restauré
 * depuis la base, et le chat se rouvre s'il était ouvert.
 */
export default function NocturaChat() {
  const pathname = usePathname();
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const historyLoadedRef = useRef(false);
  const idSeq = useRef(0);

  const nextId = () => `m${++idSeq.current}-${Date.now()}`;

  /** Ouvre/ferme en mémorisant l'état pour les changements de page (onglet courant). */
  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    try {
      if (v) sessionStorage.setItem(OPEN_KEY, '1');
      else sessionStorage.removeItem(OPEN_KEY);
    } catch {
      // stockage indisponible (navigation privée stricte) — sans conséquence
    }
  }, []);

  /** Restaure l'historique de la conversation depuis la base (une seule fois). */
  const loadHistory = useCallback(async () => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    const id = conversationIdRef.current;
    if (!id) return;
    try {
      const res = await fetch(`/api/chat/history?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length) {
        setMessages(
          data.messages.map((m: { role: string; content: string }) => ({
            id: nextId(),
            role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            content: m.content,
          })),
        );
      }
    } catch {
      // hors-ligne : la visiteuse repart simplement de l'accueil
    }
  }, []);

  // Au chargement d'une page : récupère la conversation, et rouvre le chat
  // s'il était ouvert sur la page précédente (avec son historique).
  useEffect(() => {
    conversationIdRef.current = localStorage.getItem(STORAGE_KEY);
    let wasOpen = false;
    try {
      wasOpen = sessionStorage.getItem(OPEN_KEY) === '1';
    } catch {
      /* stockage indisponible */
    }
    if (wasOpen) {
      setOpenState(true);
      void loadHistory();
    }
  }, [loadHistory]);

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
      {!open && (
        <ChatLauncher
          onOpen={() => {
            setOpen(true);
            void loadHistory(); // reprend la conversation là où elle était
          }}
        />
      )}
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
