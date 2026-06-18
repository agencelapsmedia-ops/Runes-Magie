'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ColumnField = 'name' | 'description' | 'longDescription' | 'imageUrl' | 'features';
type LandingTextField =
  | 'eyebrow'
  | 'subtitle'
  | 'sanctuaryTitle'
  | 'pillarsTitle'
  | 'processTitle'
  | 'faqTitle'
  | 'finalTitle'
  | 'finalText'
  | 'ctaLabel'
  | 'imageAlt'
  | 'faqImageAlt'
  | 'backgroundUrl'
  | 'characterUrl';
type EditableField = ColumnField | LandingTextField | 'steps' | 'faqs' | 'pillarRunes';

const MULTILINE_FIELDS: ReadonlySet<EditableField> = new Set([
  'features',
  'steps',
  'faqs',
  'pillarRunes',
  'longDescription',
  'finalText',
]);

interface EditTarget {
  field: EditableField;
  label: string;
  value: string | string[];
  helper?: string;
}

interface ArcaneEditorProviderProps {
  offeringId: string;
  targets: EditTarget[];
  children: React.ReactNode;
}

const LINES = (draft: string) =>
  draft.split('\n').map((line) => line.trim()).filter(Boolean);

/** Découpe une ligne « Partie A || Partie B » en deux morceaux nettoyés. */
function splitPair(line: string): [string, string] {
  const [first, ...rest] = line.split('||');
  return [first.trim(), rest.join('||').trim()];
}

/** Construit le corps de la requête PATCH selon le type de champ. */
function buildPayload(field: EditableField, draft: string): Record<string, unknown> {
  if (field === 'features') {
    return { features: LINES(draft) };
  }
  if (field === 'pillarRunes') {
    return { pillarRunes: LINES(draft) };
  }
  if (field === 'steps') {
    return {
      steps: LINES(draft).map((line, index) => {
        const [title, text] = splitPair(line);
        return { number: String(index + 1).padStart(2, '0'), title, text };
      }),
    };
  }
  if (field === 'faqs') {
    return {
      faqs: LINES(draft).map((line) => {
        const [question, answer] = splitPair(line);
        return { question, answer };
      }),
    };
  }
  return { [field]: draft };
}

/** Contexte qui expose l'ouverture du pupitre d'édition aux boutons ✦ disséminés dans la page. */
const ArcaneEditorContext = createContext<((field: EditableField) => void) | null>(null);

export function ArcaneFieldButton({
  field,
  label,
  position = '-right-3 -top-3',
}: {
  field: EditableField;
  label: string;
  position?: string;
}) {
  const openEditor = useContext(ArcaneEditorContext);
  return <ArcaneEditButton label={label} position={position} onClick={() => openEditor?.(field)} />;
}

function ArcaneEditButton({
  label,
  onClick,
  position,
}: {
  label: string;
  onClick: () => void;
  position: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute ${position} z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[#0A1028]/95 text-[#E6C87A] shadow-[0_0_18px_rgba(255,0,184,0.35)] transition hover:scale-105 hover:border-[#FF4FD8]`}
      aria-label={label}
      title={label}
    >
      <span aria-hidden className="text-sm">✦</span>
    </button>
  );
}

/**
 * Enveloppe la page de service en mode admin : fournit le contexte d'édition aux
 * boutons ✦ et rend le pupitre coulissant. Les boutons appellent `openEditor(field)`
 * via le contexte React (plus de pont `window`).
 */
export default function ArcaneEditorProvider({ offeringId, targets, children }: ArcaneEditorProviderProps) {
  const router = useRouter();
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeTarget = useMemo(
    () => targets.find((target) => target.field === activeField) ?? null,
    [activeField, targets],
  );

  const openEditor = useMemo(
    () => (field: EditableField) => {
      const target = targets.find((item) => item.field === field);
      if (!target) return;
      setActiveField(field);
      setDraft(Array.isArray(target.value) ? target.value.join('\n') : target.value);
      setError('');
    },
    [targets],
  );

  async function save() {
    if (!activeTarget) return;
    setSaving(true);
    setError('');

    const payload = buildPayload(activeTarget.field, draft);

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
    <ArcaneEditorContext.Provider value={openEditor}>
      {children}

      <div className="fixed bottom-5 left-5 z-40 hidden rounded-sm border border-[#D4AF37]/40 bg-[#0A1028]/90 px-4 py-3 font-cinzel text-[0.68rem] uppercase tracking-[0.18em] text-[#E6C87A] shadow-[0_0_24px_rgba(106,0,255,0.35)] backdrop-blur md:block">
        Mode édition des arcanes actif
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
              rows={MULTILINE_FIELDS.has(activeTarget.field) ? 12 : 5}
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
    </ArcaneEditorContext.Provider>
  );
}
