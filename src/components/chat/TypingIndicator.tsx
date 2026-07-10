'use client';

/** Trois points dorés pulsants — Noctura compose sa réponse. */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2" role="status" aria-label="Noctura écrit…">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block h-2 w-2 rounded-full bg-or-ancien/80 motion-safe:animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}
