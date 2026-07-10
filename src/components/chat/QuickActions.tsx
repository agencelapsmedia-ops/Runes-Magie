'use client';

/** Puces d'actions rapides (pillules dorées) — envoient un message pré-écrit. */
export default function QuickActions({
  actions,
  onPick,
  disabled = false,
}: {
  actions: { label: string; message: string }[];
  onPick: (message: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          disabled={disabled}
          onClick={() => onPick(a.message)}
          className="min-h-11 rounded-full border border-or-ancien/40 bg-or-ancien/5 px-4 py-2 font-cinzel text-[0.68rem] uppercase tracking-[0.1em] text-or-clair transition-all duration-300 hover:border-or-ancien hover:bg-or-ancien/15 focus-visible:outline-2 focus-visible:outline-or-ancien disabled:opacity-50"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
