'use client';

import { useRef, useState } from 'react';

/** Zone de saisie : textarea 16 px + bouton d'envoi doré. */
export default function ChatComposer({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const message = value.trim();
    if (!message || disabled) return;
    setValue('');
    onSend(message);
    textareaRef.current?.focus();
  }

  return (
    <div className="shrink-0 border-t border-or-ancien/25 p-3">
      <div className="flex items-end gap-2 rounded-xl border border-violet-royal/50 bg-noir-nuit/60 px-3 py-2 transition-shadow focus-within:border-or-ancien/60 focus-within:shadow-[0_0_12px_rgba(201,168,76,0.25)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Écrivez votre question…"
          aria-label="Votre message pour Noctura"
          className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent py-2 font-cormorant text-base leading-snug text-parchemin outline-none placeholder:text-parchemin-vieilli/40"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Envoyer le message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-or-ancien to-or-clair text-charbon-mystere shadow-[0_0_12px_rgba(201,168,76,0.4)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-ancien disabled:opacity-40 disabled:shadow-none"
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
