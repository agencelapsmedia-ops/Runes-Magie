'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { uploadImage, listImages } from '@/lib/supabase';

type ColumnField = 'name' | 'description' | 'longDescription' | 'imageUrl' | 'features';
type LandingTextField =
  | 'eyebrow'
  | 'subtitle'
  | 'intro'
  | 'sanctuaryTitle'
  | 'sanctuaryText'
  | 'pillarsTitle'
  | 'processTitle'
  | 'faqTitle'
  | 'finalTitle'
  | 'finalText'
  | 'ctaLabel'
  | 'imageAlt'
  | 'faqImageAlt'
  | 'backgroundUrl'
  | 'characterUrl'
  | 'faqImageUrl';
type EditableField = ColumnField | LandingTextField | 'steps' | 'faqs' | 'pillarRunes' | 'pillarIcons' | 'benefits';

/** Champs qui pointent vers une image → sélecteur visuel + médiathèque. */
const IMAGE_FIELDS: ReadonlySet<EditableField> = new Set([
  'imageUrl',
  'backgroundUrl',
  'characterUrl',
  'faqImageUrl',
]);

const MULTILINE_FIELDS: ReadonlySet<EditableField> = new Set([
  'features',
  'benefits',
  'steps',
  'faqs',
  'pillarRunes',
  'intro',
  'longDescription',
  'sanctuaryText',
  'finalText',
]);

interface EditTarget {
  field: EditableField;
  label: string;
  value: string | string[];
  helper?: string;
  /** Libellés (ex. noms des piliers) pour les éditeurs ligne-à-ligne comme `pillarIcons`. */
  items?: string[];
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
  if (field === 'benefits') {
    return { benefits: LINES(draft) };
  }
  if (field === 'pillarRunes') {
    return { pillarRunes: LINES(draft) };
  }
  if (field === 'pillarIcons') {
    // Une URL par ligne, alignée aux piliers : on garde les lignes vides (icône absente),
    // mais on retire les lignes vides finales pour éviter les entrées superflues.
    const icons = draft.split('\n').map((line) => line.trim());
    while (icons.length && !icons[icons.length - 1]) icons.pop();
    return { pillarIcons: icons };
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

/**
 * Sélecteur d'image du pupitre : téléversement (glisser-déposer) + médiathèque
 * (toutes les images du site) + champ URL. La valeur retenue est l'URL (draft).
 */
function ImageFieldEditor({
  draft,
  setDraft,
  helper,
}: {
  draft: string;
  setDraft: (value: string) => void;
  helper?: string;
}) {
  const [tab, setTab] = useState<'upload' | 'media'>('upload');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [media, setMedia] = useState<string[] | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab !== 'media' || media || loadingMedia) return;
    setLoadingMedia(true);
    listImages()
      .then(setMedia)
      .catch(() => setErr('Médiathèque indisponible.'))
      .finally(() => setLoadingMedia(false));
  }, [tab, media, loadingMedia]);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setErr('Format accepté : JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr('Image trop lourde (maximum 5 Mo).');
      return;
    }
    setErr('');
    setUploading(true);
    try {
      const url = await uploadImage(file, 'offerings');
      setDraft(url);
      setMedia((m) => (m ? [url, ...m] : m));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setUploading(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-sm border px-3 py-2 font-cinzel text-[0.65rem] uppercase tracking-[0.16em] transition ${
      active
        ? 'border-[#E6C87A] bg-[#D4AF37]/15 text-[#E6C87A]'
        : 'border-[#9A6CFF]/40 text-parchemin/70 hover:border-[#00D9D9] hover:text-[#00D9D9]'
    }`;

  return (
    <div>
      {/* Aperçu de l'image actuelle */}
      <div className="relative mb-4 aspect-square w-28 overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-black/40">
        {draft ? (
          <Image src={draft} alt="Aperçu" fill unoptimized className="object-cover" sizes="112px" />
        ) : (
          <span className="flex h-full items-center justify-center font-philosopher text-xs text-parchemin/40">
            Aucune image
          </span>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <button type="button" className={tabClass(tab === 'upload')} onClick={() => setTab('upload')}>
          📤 Téléverser
        </button>
        <button type="button" className={tabClass(tab === 'media')} onClick={() => setTab('media')}>
          🖼️ Médiathèque
        </button>
      </div>

      {tab === 'upload' && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="cursor-pointer rounded-sm border-2 border-dashed border-[#D4AF37]/40 bg-black/25 p-6 text-center transition hover:border-[#FF4FD8]"
        >
          {uploading ? (
            <p className="font-philosopher text-sm text-[#00D9D9]">Téléversement en cours…</p>
          ) : (
            <p className="font-philosopher text-sm text-parchemin/70">
              <span className="text-[#E6C87A]">Cliquez</span> ou glissez une image ici
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {tab === 'media' && (
        <div className="max-h-64 overflow-y-auto rounded-sm border border-[#D4AF37]/25 bg-black/25 p-2">
          {loadingMedia && <p className="p-3 font-philosopher text-sm text-parchemin/60">Chargement…</p>}
          {!loadingMedia && media && media.length === 0 && (
            <p className="p-3 font-philosopher text-sm text-parchemin/60">Aucune image trouvée.</p>
          )}
          {media && media.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {media.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setDraft(url)}
                  className={`relative aspect-square overflow-hidden rounded-sm border transition ${
                    draft === url ? 'border-[#E6C87A] ring-2 ring-[#FF4FD8]' : 'border-transparent hover:border-[#00D9D9]'
                  }`}
                >
                  <Image src={url} alt="" fill unoptimized className="object-cover" sizes="100px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Champ URL (repli / collage manuel) */}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="…ou colle une URL d'image"
        className="mt-3 w-full rounded-sm border border-[#D4AF37]/30 bg-black/35 p-2 font-philosopher text-sm text-parchemin outline-none transition focus:border-[#FF4FD8]"
      />

      {helper && <p className="mt-2 font-philosopher text-sm text-parchemin-vieilli/55">{helper}</p>}
      {err && <p className="mt-2 font-philosopher text-sm text-[#FF4FD8]">{err}</p>}
    </div>
  );
}

/**
 * Éditeur des icônes des piliers : une ligne par pilier (libellé), chacune avec
 * sa propre icône (aperçu + téléverser + médiathèque partagée). La valeur retenue
 * est l'ensemble des URLs jointes par retour-ligne (alignées sur les piliers).
 */
function PillarIconsEditor({
  draft,
  setDraft,
  items,
  helper,
}: {
  draft: string;
  setDraft: (value: string) => void;
  items: string[];
  helper?: string;
}) {
  const icons = useMemo(() => {
    const lines = draft.length ? draft.split('\n') : [];
    return items.map((_, i) => (lines[i] ?? '').trim());
  }, [draft, items]);

  const [media, setMedia] = useState<string[] | null>(null);
  const [pickerRow, setPickerRow] = useState<number | null>(null);
  const [uploadingRow, setUploadingRow] = useState<number | null>(null);
  const [err, setErr] = useState('');

  function setIcon(index: number, url: string) {
    const next = items.map((_, i) => (i === index ? url : icons[i] ?? ''));
    setDraft(next.join('\n'));
  }

  function openPicker(index: number) {
    setErr('');
    setPickerRow(index);
    if (!media) {
      listImages()
        .then(setMedia)
        .catch(() => setErr('Médiathèque indisponible.'));
    }
  }

  async function onFile(index: number, file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setErr('Format accepté : JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr('Image trop lourde (maximum 5 Mo).');
      return;
    }
    setErr('');
    setUploadingRow(index);
    try {
      const url = await uploadImage(file, 'services/arcane/icons');
      setIcon(index, url);
      setMedia((m) => (m ? [url, ...m] : m));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec du téléversement.');
    } finally {
      setUploadingRow(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto pr-1">
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          className="rounded-sm border border-[#D4AF37]/25 bg-black/25 p-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-black/40">
              {icons[index] ? (
                <Image src={icons[index]} alt="" fill unoptimized className="object-contain p-1" sizes="48px" />
              ) : (
                <span className="flex h-full items-center justify-center font-cinzel-decorative text-lg text-[#E6C87A]/50">
                  ✦
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-cinzel text-[0.7rem] uppercase tracking-[0.12em] text-parchemin/90">
                {label || `Pilier ${index + 1}`}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-sm border border-[#9A6CFF]/40 px-2 py-1 font-cinzel text-[0.6rem] uppercase tracking-[0.14em] text-parchemin/70 transition hover:border-[#00D9D9] hover:text-[#00D9D9]">
                  {uploadingRow === index ? '…' : '📤 Téléverser'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      onFile(index, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => openPicker(pickerRow === index ? -1 : index)}
                  className="rounded-sm border border-[#9A6CFF]/40 px-2 py-1 font-cinzel text-[0.6rem] uppercase tracking-[0.14em] text-parchemin/70 transition hover:border-[#00D9D9] hover:text-[#00D9D9]"
                >
                  🖼️ Médiathèque
                </button>
                {icons[index] && (
                  <button
                    type="button"
                    onClick={() => setIcon(index, '')}
                    className="rounded-sm border border-[#FF4FD8]/40 px-2 py-1 font-cinzel text-[0.6rem] uppercase tracking-[0.14em] text-[#FF4FD8]/80 transition hover:border-[#FF4FD8]"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          </div>

          {pickerRow === index && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-sm border border-[#D4AF37]/25 bg-black/30 p-2">
              {!media && <p className="p-2 font-philosopher text-sm text-parchemin/60">Chargement…</p>}
              {media && media.length === 0 && (
                <p className="p-2 font-philosopher text-sm text-parchemin/60">Aucune image trouvée.</p>
              )}
              {media && media.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {media.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        setIcon(index, url);
                        setPickerRow(null);
                      }}
                      className={`relative aspect-square overflow-hidden rounded-sm border transition ${
                        icons[index] === url
                          ? 'border-[#E6C87A] ring-2 ring-[#FF4FD8]'
                          : 'border-transparent hover:border-[#00D9D9]'
                      }`}
                    >
                      <Image src={url} alt="" fill unoptimized className="object-contain p-1" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {helper && <p className="mt-1 font-philosopher text-sm text-parchemin-vieilli/55">{helper}</p>}
      {err && <p className="font-philosopher text-sm text-[#FF4FD8]">{err}</p>}
    </div>
  );
}

/**
 * Éditeur de listes « paire » (étapes, FAQ) : chaque entrée est scindée en deux
 * champs distincts (titre + texte) plutôt qu'une ligne « A || B ». La valeur
 * retenue reste « Titre || Texte » jointe par retour-ligne (compatible buildPayload).
 */
function PairListEditor({
  draft,
  setDraft,
  firstLabel,
  secondLabel,
  addLabel,
  helper,
}: {
  draft: string;
  setDraft: (value: string) => void;
  firstLabel: string;
  secondLabel: string;
  addLabel: string;
  helper?: string;
}) {
  const rows = useMemo<[string, string][]>(
    () => (draft.length ? draft.split('\n').map((line) => splitPair(line)) : []),
    [draft],
  );

  const commit = (next: [string, string][]) =>
    setDraft(next.map(([a, b]) => `${a} || ${b}`).join('\n'));

  const update = (index: number, slot: 0 | 1, value: string) => {
    const next = rows.map((row) => [...row] as [string, string]);
    if (!next[index]) next[index] = ['', ''];
    next[index][slot] = value;
    commit(next);
  };

  const inputClass =
    'w-full rounded-sm border border-[#D4AF37]/30 bg-black/35 p-2 font-cormorant text-base text-parchemin outline-none transition focus:border-[#FF4FD8]';

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-1">
      {rows.map(([first, second], index) => (
        <div key={index} className="rounded-sm border border-[#D4AF37]/25 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-cinzel text-[0.62rem] uppercase tracking-[0.18em] text-[#00D9D9]">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={() => commit(rows.filter((_, j) => j !== index))}
              className="rounded-sm border border-[#FF4FD8]/40 px-2 py-1 font-cinzel text-[0.58rem] uppercase tracking-[0.14em] text-[#FF4FD8]/80 transition hover:border-[#FF4FD8]"
            >
              Supprimer
            </button>
          </div>
          <label className="font-cinzel text-[0.6rem] uppercase tracking-[0.16em] text-[#E6C87A]">
            {firstLabel}
          </label>
          <input
            type="text"
            value={first}
            onChange={(e) => update(index, 0, e.target.value)}
            className={`mt-1 mb-3 ${inputClass}`}
          />
          <label className="font-cinzel text-[0.6rem] uppercase tracking-[0.16em] text-[#E6C87A]">
            {secondLabel}
          </label>
          <textarea
            value={second}
            onChange={(e) => update(index, 1, e.target.value)}
            rows={3}
            className={`mt-1 resize-y leading-relaxed ${inputClass}`}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => commit([...rows, ['', '']])}
        className="rounded-sm border border-[#9A6CFF]/50 px-4 py-2 font-cinzel text-[0.62rem] uppercase tracking-[0.16em] text-parchemin/80 transition hover:border-[#00D9D9] hover:text-[#00D9D9]"
      >
        + {addLabel}
      </button>

      {helper && <p className="mt-1 font-philosopher text-sm text-parchemin-vieilli/55">{helper}</p>}
    </div>
  );
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

            {activeTarget.field === 'pillarIcons' ? (
              <PillarIconsEditor
                draft={draft}
                setDraft={setDraft}
                items={activeTarget.items ?? []}
                helper={activeTarget.helper}
              />
            ) : activeTarget.field === 'steps' ? (
              <PairListEditor
                draft={draft}
                setDraft={setDraft}
                firstLabel="Titre de l'étape"
                secondLabel="Texte de l'étape"
                addLabel="Ajouter une étape"
                helper="La numérotation (01, 02…) est automatique."
              />
            ) : activeTarget.field === 'faqs' ? (
              <PairListEditor
                draft={draft}
                setDraft={setDraft}
                firstLabel="Question"
                secondLabel="Réponse"
                addLabel="Ajouter une question"
              />
            ) : IMAGE_FIELDS.has(activeTarget.field) ? (
              <ImageFieldEditor draft={draft} setDraft={setDraft} helper={activeTarget.helper} />
            ) : (
              <>
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
              </>
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
