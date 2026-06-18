'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type EditableField = 'name' | 'description' | 'longDescription' | 'imageUrl' | 'features';

interface EditTarget {
  field: EditableField;
  label: string;
  value: string | string[];
  helper?: string;
}

interface ArcaneInlineEditorProps {
  offeringId: string;
  targets: EditTarget[];
}

export function ArcaneFieldButton({
  field,
  label,
}: {
  field: EditableField;
  label: string;
}) {
  return <ArcaneEditButton label={label} onClick={() => window.__openArcaneEditor?.(field)} />;
}

function ArcaneEditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -right-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[#0A1028]/95 text-[#E6C87A] shadow-[0_0_18px_rgba(255,0,184,0.35)] transition hover:scale-105 hover:border-[#FF4FD8]"
      aria-label={label}
      title={label}
    >
      <span aria-hidden className="text-sm">✦</span>
    </button>
  );
}

export default function ArcaneInlineEditor({ offeringId, targets }: ArcaneInlineEditorProps) {
  const router = useRouter();
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeTarget = useMemo(
    () => targets.find((target) => target.field === activeField) ?? null,
    [activeField, targets],
  );

  function openEditor(field: EditableField) {
    const target = targets.find((item) => item.field === field);
    if (!target) return;
    setActiveField(field);
    setDraft(Array.isArray(target.value) ? target.value.join('\n') : target.value);
    setError('');
  }

  async function save() {
    if (!activeTarget) return;
    setSaving(true);
    setError('');

    const payload =
      activeTarget.field === 'features'
        ? { features: draft.split('\n').map((line) => line.trim()).filter(Boolean) }
        : { [activeTarget.field]: draft };

    const res = await fetch(`/api/admin/offerings/${offeringId}/landing`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "La modification n'a pas pu être scellée.");
      return;
    }

    setActiveField(null);
    router.refresh();
  }

  return (
    <>
      <div className="fixed bottom-5 left-5 z-40 hidden rounded-sm border border-[#D4AF37]/40 bg-[#0A1028]/90 px-4 py-3 font-cinzel text-[0.68rem] uppercase tracking-[0.18em] text-[#E6C87A] shadow-[0_0_24px_rgba(106,0,255,0.35)] backdrop-blur md:block">
        Mode édition des arcanes actif
      </div>

      <div className="hidden">
        {targets.map((target) => (
          <button key={target.field} type="button" data-arcane-editor={target.field} onClick={() => openEditor(target.field)} />
        ))}
      </div>

      {activeTarget && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Refermer le pupitre"
            onClick={() => setActiveField(null)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[#D4AF37]/50 bg-[linear-gradient(160deg,#0A1028_0%,#2D1B69_55%,#080812_100%)] p-6 text-[#F5F0E8] shadow-[-24px_0_60px_rgba(106,0,255,0.38)]">
            <div className="mb-6 border-b border-[#D4AF37]/25 pb-5">
              <p className="font-cinzel text-xs uppercase tracking-[0.28em] text-[#00D9D9]">
                Pupitre de La Voie des Arcanes
              </p>
              <h2 className="mt-2 font-cinzel-decorative text-2xl text-gradient-gold">
                Modifier l&apos;arcane
              </h2>
              <p className="mt-3 font-cormorant text-base italic text-parchemin-vieilli/75">
                {activeTarget.label}
              </p>
            </div>

            <label className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
              Texte à sceller
            </label>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={activeTarget.field === 'features' || activeTarget.field === 'longDescription' ? 12 : 5}
              className="mt-3 min-h-40 resize-y rounded-sm border border-[#D4AF37]/35 bg-black/35 p-4 font-cormorant text-lg leading-relaxed text-parchemin outline-none transition focus:border-[#FF4FD8] focus:shadow-[0_0_22px_rgba(255,0,184,0.24)]"
            />
            {activeTarget.helper && (
              <p className="mt-3 font-philosopher text-sm text-parchemin-vieilli/55">
                {activeTarget.helper}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-sm border border-[#FF4FD8]/40 bg-[#FF00B8]/10 px-3 py-2 font-philosopher text-sm text-[#FF4FD8]">
                {error}
              </p>
            )}

            <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-sm border border-[#E6C87A]/70 bg-[linear-gradient(90deg,#D4AF37,#E6C87A,#B8860B)] px-5 py-3 font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#0A1028] shadow-[0_0_24px_rgba(212,175,55,0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Scellement...' : 'Sceller la modification'}
              </button>
              <button
                type="button"
                onClick={() => setActiveField(null)}
                className="flex-1 rounded-sm border border-[#9A6CFF]/55 px-5 py-3 font-cinzel text-xs uppercase tracking-[0.18em] text-parchemin transition hover:border-[#00D9D9] hover:text-[#00D9D9]"
              >
                Refermer le pupitre
              </button>
            </div>
          </aside>
        </div>
      )}

      <ArcaneEditorBridge onOpen={openEditor} />
    </>
  );
}

function ArcaneEditorBridge({ onOpen }: { onOpen: (field: EditableField) => void }) {
  if (typeof window !== 'undefined') {
    window.__openArcaneEditor = onOpen;
  }
  return null;
}

declare global {
  interface Window {
    __openArcaneEditor?: (field: EditableField) => void;
  }
}
