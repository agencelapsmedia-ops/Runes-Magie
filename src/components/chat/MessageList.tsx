'use client';

import { useEffect, useRef } from 'react';
import type { ChatMsg } from './types';
import AssistantMessage from './AssistantMessage';
import UserMessage from './UserMessage';
import TypingIndicator from './TypingIndicator';
import HumanHandoff from './HumanHandoff';

/** Liste des messages : défilement auto vers le bas, indicateur d'écriture. */
export default function MessageList({
  messages,
  typing,
  showHandoff,
}: {
  messages: ChatMsg[];
  typing: boolean;
  showHandoff: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing, showHandoff]);

  return (
    <div className="flex flex-col gap-3 px-4 py-4" role="log" aria-live="polite" aria-label="Conversation avec Noctura">
      {messages.map((m) =>
        m.role === 'assistant' ? (
          <AssistantMessage key={m.id} content={m.content} />
        ) : (
          <UserMessage key={m.id} content={m.content} />
        ),
      )}
      {showHandoff && <HumanHandoff />}
      {typing && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
