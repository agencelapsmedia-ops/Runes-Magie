'use client';

import { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';

/**
 * Coquille de la fenêtre du chat : 420 px × max 72 vh sur ordinateur,
 * quasi plein écran sur mobile (100dvh, marge 8 px). En-tête et saisie fixes,
 * contenu défilable. Échap ferme.
 */
export default function ChatWindow({
  onClose,
  children,
  composer,
}: {
  onClose: () => void;
  children: React.ReactNode;
  composer: React.ReactNode;
}) {
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-modal="false"
      aria-label="Conversation avec Noctura"
      className="fixed inset-2 z-[96] flex flex-col overflow-hidden rounded-3xl border border-or-ancien/40 shadow-[0_20px_70px_rgba(0,0,0,0.65),0_0_40px_rgba(107,63,160,0.25)] motion-safe:animate-fade-in md:inset-auto md:bottom-5 md:right-5 md:h-[min(72vh,720px)] md:w-[420px]"
      style={{
        background: 'linear-gradient(160deg, #0A0A12 0%, #1A1A2E 55%, #2D1B4E 100%)',
        maxHeight: 'calc(100dvh - 16px)',
      }}
    >
      <ChatHeader onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {composer}
    </div>
  );
}
