'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { ChatMsg } from './types';
import ChatLauncher from './ChatLauncher';
import ChatWindow from './ChatWindow';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import ChatComposer from './ChatComposer';

/**
 * Remplace la zone de saisie quand personne n'est connecté : écrire à Noctura
 * exige un compte (sinon impossible de savoir qui écrit ni de faire un suivi).
 */
function ConnexionRequise() {
  return (
    <div className="shrink-0 border-t border-or-ancien/25 p-4 text-center">
      <p className="mb-3 font-cormorant text-sm leading-snug text-parchemin">
        ✦ Pour nous écrire et nous permettre un meilleur suivi de ta demande,
        connecte-toi ou crée ton compte gratuit.
      </p>
      <div className="flex items-center justify-center gap-2">
        <Link
          href="/soins/auth/register"
          className="rounded-full bg-gradient-to-br from-or-ancien to-or-clair px-4 py-2 font-cinzel text-xs uppercase tracking-wider text-charbon-mystere shadow-[0_0_12px_rgba(201,168,76,0.4)] transition-all hover:brightness-110"
        >
          Créer mon compte
        </Link>
        <Link
          href="/soins/auth/login"
          className="rounded-full border border-or-ancien/50 px-4 py-2 font-cinzel text-xs uppercase tracking-wider text-or-clair transition-all hover:bg-or-ancien/10"
        >
          Me connecter
        </Link>
      </div>
    </div>
  );
}

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
  // null = état inconnu (vérification en cours) ; false = pas de compte connecté.
  const [connectee, setConnectee] = useState<boolean | null>(null);
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
            // `assistant-humain` (réponse d'Annabelle) s'affiche comme Noctura.
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
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
  // Écrire dans le chat exige un compte : on vérifie la session une fois.
  useEffect(() => {
    fetch('/api/chat/moi')
      .then((r) => r.json())
      .then((d) => setConnectee(!!d.connectee))
      .catch(() => setConnectee(false));
  }, []);

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

  // L'onglet « Messages » de la barre du bas ouvre le chat. Un évènement plutôt
  // qu'un contexte partagé : six lignes ici, et la barre n'a rien à savoir du
  // fonctionnement interne du chat.
  useEffect(() => {
    const ouvrir = () => {
      setOpen(true);
      void loadHistory();
    };
    window.addEventListener('noctura:ouvrir', ouvrir);
    return () => window.removeEventListener('noctura:ouvrir', ouvrir);
  }, [setOpen, loadHistory]);

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
          composer={
            connectee === false ? (
              <ConnexionRequise />
            ) : (
              <ChatComposer onSend={sendMessage} disabled={typing || connectee === null} />
            )
          }
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
