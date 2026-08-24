'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Zone de réponse humaine d'une conversation du chat. Le message apparaît
 * comme une bulle de Noctura chez la visiteuse (au prochain chargement de son
 * chat) et est étiqueté « Toi » dans la transcription admin.
 */
export default function ReplyBox({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const message = value.trim();
    if (!message || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/chat-conversations/${conversationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Échec de l’envoi.');
          return;
        }
        setValue('');
        router.refresh();
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  return (
    <div style={{ marginTop: '20px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 700, color: '#6B3FA0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Répondre (la visiteuse verra ta réponse dans son chat)
      </p>
      {error && (
        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#B91C1C' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Écris ta réponse…"
          style={{ flex: 1, resize: 'vertical', minHeight: '56px', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.92rem', fontFamily: 'inherit', color: '#1F2937', outline: 'none' }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !value.trim()}
          style={{
            padding: '10px 20px',
            background: pending || !value.trim() ? '#C4B5FD' : '#6B3FA0',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: pending || !value.trim() ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {pending ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
