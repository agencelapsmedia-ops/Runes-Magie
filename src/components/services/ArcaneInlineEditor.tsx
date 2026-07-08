'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { uploadImage, listImages } from '@/lib/supabase';
import { analyzeSeo, scoreLabel, type SeoCheckStatus } from '@/lib/seo-analysis';
import { FONTS, FONT_KEYS, FONT_FIELDS, TITLE_FONT_FIELDS } from '@/lib/service-landing';

type ColumnField = 'name' | 'description' | 'longDescription' | 'imageUrl' | 'features';
type LandingTextField =
  | 'eyebrow'
  | 'subtitle'
  | 'intro'
  | 'sanctuaryTitle'
  | 'sanctuaryText'
  | 'recognitionTitle'
  | 'recognitionIntro'
  | 'recognitionFinalText'
  | 'recognitionPortalText'
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
type FontField = 'titleFont' | 'labelFont' | 'bodyFont';
type TitleFontField =
  | 'heroTitleFont'
  | 'sanctuaryTitleFont'
  | 'recognitionTitleFont'
  | 'pillarsTitleFont'
  | 'processTitleFont'
  | 'faqTitleFont'
  | 'finalTitleFont';
type EditableField =
  | ColumnField
  | LandingTextField
  | FontField
  | TitleFontField
  | 'steps'
  | 'faqs'
  | 'pillarRunes'
  | 'pillarIcons'
  | 'benefits'
  | 'recognitionItems';

/** Champs qui pointent vers une police → sélecteur visuel FontPicker. */
const FONT_FIELD_SET: ReadonlySet<EditableField> = new Set([...FONT_FIELDS, ...TITLE_FONT_FIELDS]);

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
  'recognitionItems',
  'steps',
  'faqs',
  'pillarRunes',
  'intro',
  'recognitionIntro',
  'longDescription',
  'sanctuaryText',
  'recognitionFinalText',
  'recognitionPortalText',
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

/** Données fournies au panneau SEO (calculées côté serveur dans le template). */
export interface SeoPanelData {
  slug: string;
  detailHref: string;
  adminEditHref: string;
  siteUrl: string;
  // Valeurs personnalisées actuelles (overrides).
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  ogImage: string;
  // Valeurs auto utilisées si les champs sont vides.
  autoTitle: string;
  autoDescription: string;
  heroImage: string;
  // Données d'analyse SEO.
  h1: string;
  intro: string;
  bodyText: string;
  imageAlts: string[];
  faqCount: number;
}

interface ArcaneEditorProviderProps {
  offeringId: string;
  targets: EditTarget[];
  seo?: SeoPanelData;
  children: React.ReactNode;
}

const LINES = (draft: string) =>
  draft.split('\n').map((line) => line.trim()).filter(Boolean);

/** Découpe une ligne « Partie A || Partie B » en deux morceaux nettoyés. */
function splitPair(line: string): [string, string] {
  const [first, ...rest] = line.split('||');
  return [first.trim(), rest.join('||').trim()];
}

/**
 * Séparateur d'entrées des éditeurs « paire » (FAQ, étapes) : un caractère de contrôle
 * (Record Separator) que personne ne tape au clavier. Ainsi un retour-ligne saisi DANS
 * une réponse/un texte n'est plus confondu avec la séparation entre deux entrées. Il ne
 * vit que dans le brouillon transitoire : jamais affiché, jamais stocké (retiré au save).
 */
const ROW_SEP = '\u001e';
const splitRows = (draft: string) =>
  draft.split(ROW_SEP).map((row) => row.trim()).filter(Boolean);

/** Construit le corps de la requête PATCH selon le type de champ. */
function buildPayload(field: EditableField, draft: string): Record<string, unknown> {
  if (field === 'features') {
    return { features: LINES(draft) };
  }
  if (field === 'benefits') {
    return { benefits: LINES(draft) };
  }
  if (field === 'recognitionItems') {
    return { recognitionItems: LINES(draft) };
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
      steps: splitRows(draft).map((line, index) => {
        const [title, text] = splitPair(line);
        return { number: String(index + 1).padStart(2, '0'), title, text };
      }),
    };
  }
  if (field === 'faqs') {
    return {
      faqs: splitRows(draft).map((line) => {
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
 * champs distincts (titre + texte) plutôt qu'une ligne « A || B ». La valeur retenue
 * reste « Titre || Texte », mais les entrées sont jointes par ROW_SEP (et NON par un
 * retour-ligne) : ainsi un saut de ligne saisi dans le texte reste du contenu au lieu
 * de créer une fausse entrée. Compatible avec buildPayload, qui redécoupe via splitRows().
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
    () => (draft.length ? draft.split(ROW_SEP).map((line) => splitPair(line)) : []),
    [draft],
  );

  const commit = (next: [string, string][]) =>
    setDraft(next.map(([a, b]) => `${a} || ${b}`).join(ROW_SEP));

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

/**
 * Sélecteur de police : un bouton par police du projet, chacun rendu DANS sa
 * propre police (aperçu visuel direct). La valeur retenue (`draft`) est la clé.
 */
function FontPicker({
  draft,
  setDraft,
}: {
  draft: string;
  setDraft: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto pr-1">
      {FONT_KEYS.map((key) => {
        const active = draft === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setDraft(key)}
            style={{ fontFamily: FONTS[key].css }}
            className={`rounded-sm border px-4 py-4 text-left text-2xl leading-tight transition ${
              active
                ? 'border-[#E6C87A] bg-[#D4AF37]/15 text-[#E6C87A]'
                : 'border-[#9A6CFF]/40 text-parchemin/80 hover:border-[#00D9D9] hover:text-[#00D9D9]'
            }`}
          >
            {FONTS[key].label}
          </button>
        );
      })}
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

const STATUS_DOT: Record<SeoCheckStatus, string> = {
  good: 'bg-[#2ecc71]',
  warn: 'bg-[#E6C87A]',
  bad: 'bg-[#FF4FD8]',
};
const TONE_TEXT: Record<SeoCheckStatus, string> = {
  good: 'text-[#2ecc71]',
  warn: 'text-[#E6C87A]',
  bad: 'text-[#FF4FD8]',
};

/** Compteur de caractères coloré (vert dans la plage idéale). */
function CharCount({ len, min, max }: { len: number; min: number; max: number }) {
  const tone: SeoCheckStatus = len >= min && len <= max ? 'good' : len === 0 ? 'bad' : 'warn';
  return (
    <span className={`font-philosopher text-xs ${TONE_TEXT[tone]}`}>
      {len} caractères · idéal {min}–{max}
    </span>
  );
}

/**
 * Panneau SEO « façon Rank Math » : mot-clé cible, meta-titre/description avec
 * compteurs, image de partage, aperçu Google en direct et score + check-list.
 * Réservé à l'admin (rendu seulement par le provider quand `canEdit`).
 */
function SeoPanel({
  offeringId,
  seo,
  onClose,
}: {
  offeringId: string;
  seo: SeoPanelData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [metaTitle, setMetaTitle] = useState(seo.metaTitle);
  const [metaDescription, setMetaDescription] = useState(seo.metaDescription);
  const [focusKeyword, setFocusKeyword] = useState(seo.focusKeyword);
  const [ogImage, setOgImage] = useState(seo.ogImage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Valeurs effectives (ce qui sera réellement utilisé si le champ est vide).
  const effectiveTitle = metaTitle.trim() || seo.autoTitle;
  const effectiveDescription = metaDescription.trim() || seo.autoDescription;
  const effectiveOg = ogImage.trim() || seo.heroImage;

  const analysis = useMemo(
    () =>
      analyzeSeo({
        focusKeyword,
        metaTitle: effectiveTitle,
        metaDescription: effectiveDescription,
        slug: seo.slug,
        h1: seo.h1,
        intro: seo.intro,
        bodyText: seo.bodyText,
        imageAlts: seo.imageAlts,
        faqCount: seo.faqCount,
      }),
    [focusKeyword, effectiveTitle, effectiveDescription, seo],
  );

  const { label: scoreText, tone: scoreTone } = scoreLabel(analysis.score);
  const previewUrl = `${seo.siteUrl}${seo.detailHref}`.replace(/^https?:\/\//, '');

  async function save() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/offerings/${offeringId}/landing`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metaTitle, metaDescription, focusKeyword, ogImage }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Le SEO n'a pas pu être scellé.");
      return;
    }
    onClose();
    router.refresh();
  }

  const fieldClass =
    'mt-2 w-full rounded-sm border border-[#D4AF37]/35 bg-black/35 p-3 font-cormorant text-base text-parchemin outline-none transition focus:border-[#FF4FD8]';

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Refermer le panneau SEO"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 max-h-[92vh] w-[min(94vw,860px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[#D4AF37]/50 bg-[linear-gradient(160deg,#0A1028_0%,#2D1B69_55%,#080812_100%)] p-6 text-[#F5F0E8] shadow-[0_0_70px_rgba(106,0,255,0.45)] md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#D4AF37]/25 pb-5">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-[0.28em] text-[#00D9D9]">
              Référencement (SEO)
            </p>
            <h2 className="mt-2 font-cinzel-decorative text-2xl text-gradient-gold">
              Optimiser cette page
            </h2>
          </div>
          {/* Score global */}
          <div className="shrink-0 text-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 font-cinzel text-xl font-bold ${
                scoreTone === 'good'
                  ? 'border-[#2ecc71] text-[#2ecc71]'
                  : scoreTone === 'warn'
                    ? 'border-[#E6C87A] text-[#E6C87A]'
                    : 'border-[#FF4FD8] text-[#FF4FD8]'
              }`}
            >
              {analysis.score}
            </div>
            <p className={`mt-1 font-cinzel text-[0.6rem] uppercase tracking-[0.14em] ${TONE_TEXT[scoreTone]}`}>
              {scoreText}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Colonne gauche : champs */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
                Mot-clé cible
              </label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="ex. soin énergétique Saint-Eustache"
                className={fieldClass}
              />
            </div>

            <div>
              <label className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
                Titre SEO
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={seo.autoTitle}
                className={fieldClass}
              />
              <div className="mt-1">
                <CharCount len={effectiveTitle.length} min={50} max={60} />
              </div>
            </div>

            <div>
              <label className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
                Méta-description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={seo.autoDescription}
                rows={4}
                className={`${fieldClass} resize-y leading-relaxed`}
              />
              <div className="mt-1">
                <CharCount len={effectiveDescription.length} min={120} max={160} />
              </div>
            </div>

            <div>
              <label className="font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
                Image de partage (réseaux sociaux)
              </label>
              <div className="mt-2">
                <ImageFieldEditor
                  draft={ogImage}
                  setDraft={setOgImage}
                  helper="Idéal 1200×630 px. Vide → image principale de la page."
                />
              </div>
            </div>

            <div className="rounded-sm border border-[#D4AF37]/20 bg-black/20 p-3">
              <p className="font-philosopher text-xs text-parchemin-vieilli/70">
                URL : <span className="text-parchemin">/{seo.slug}</span>
              </p>
              <a
                href={seo.adminEditHref}
                className="mt-1 inline-block font-cinzel text-[0.6rem] uppercase tracking-[0.14em] text-[#00D9D9] underline-offset-2 hover:underline"
              >
                Changer l&apos;URL dans la fiche admin →
              </a>
            </div>
          </div>

          {/* Colonne droite : aperçu Google + check-list */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
                Aperçu Google
              </p>
              <div className="rounded-sm border border-[#D4AF37]/20 bg-white p-4">
                <p className="truncate font-philosopher text-xs text-[#4d5156]">{previewUrl}</p>
                <p className="mt-1 truncate font-philosopher text-lg text-[#1a0dab]">
                  {effectiveTitle}
                </p>
                <p className="mt-1 line-clamp-2 font-philosopher text-sm text-[#4d5156]">
                  {effectiveDescription}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#E6C87A]">
                Analyse ({analysis.checks.filter((c) => c.status === 'good').length}/
                {analysis.checks.length})
              </p>
              <ul className="flex flex-col gap-2">
                {analysis.checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[c.status]}`} />
                    <span className="font-philosopher text-sm">
                      <span className="text-parchemin">{c.label}</span>
                      <span className="block text-xs text-parchemin-vieilli/60">{c.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-sm border border-[#FF4FD8]/40 bg-[#FF00B8]/10 px-3 py-2 font-philosopher text-sm text-[#FF4FD8]">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-sm border border-[#E6C87A]/70 bg-[linear-gradient(90deg,#D4AF37,#E6C87A,#B8860B)] px-5 py-3 font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#0A1028] shadow-[0_0_24px_rgba(212,175,55,0.35)] transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? 'Scellement...' : 'Sceller le SEO'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-sm border border-[#9A6CFF]/55 px-5 py-3 font-cinzel text-xs uppercase tracking-[0.18em] text-parchemin transition hover:border-[#00D9D9] hover:text-[#00D9D9]"
          >
            Refermer
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Enveloppe la page de service en mode admin : fournit le contexte d'édition aux
 * boutons ✦ et rend le pupitre coulissant. Les boutons appellent `openEditor(field)`
 * via le contexte React (plus de pont `window`).
 */
export default function ArcaneEditorProvider({ offeringId, targets, seo, children }: ArcaneEditorProviderProps) {
  const router = useRouter();
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);

  const activeTarget = useMemo(
    () => targets.find((target) => target.field === activeField) ?? null,
    [activeField, targets],
  );

  const openEditor = useMemo(
    () => (field: EditableField) => {
      const target = targets.find((item) => item.field === field);
      if (!target) return;
      setActiveField(field);
      // FAQ et étapes : les entrées sont jointes par le Record Separator pour qu'un
      // retour-ligne dans une réponse/un texte reste du contenu, pas une nouvelle entrée.
      const sep = field === 'faqs' || field === 'steps' ? ROW_SEP : '\n';
      setDraft(Array.isArray(target.value) ? target.value.join(sep) : target.value);
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

      <div className="fixed bottom-5 left-5 z-40 hidden flex-col gap-2 md:flex">
        <div className="rounded-sm border border-[#D4AF37]/40 bg-[#0A1028]/90 px-4 py-3 font-cinzel text-[0.68rem] uppercase tracking-[0.18em] text-[#E6C87A] shadow-[0_0_24px_rgba(106,0,255,0.35)] backdrop-blur">
          Mode édition des arcanes actif
        </div>
        {seo && (
          <button
            type="button"
            onClick={() => setSeoOpen(true)}
            className="flex items-center justify-center gap-2 rounded-sm border border-[#00D9D9]/60 bg-[#0A1028]/90 px-4 py-3 font-cinzel text-[0.68rem] uppercase tracking-[0.18em] text-[#00D9D9] shadow-[0_0_24px_rgba(0,217,217,0.25)] backdrop-blur transition hover:border-[#00D9D9] hover:bg-[#00D9D9]/10"
          >
            🔍 Optimiser le SEO
          </button>
        )}
      </div>

      {seo && seoOpen && (
        <SeoPanel offeringId={offeringId} seo={seo} onClose={() => setSeoOpen(false)} />
      )}

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

            {FONT_FIELD_SET.has(activeTarget.field) ? (
              <FontPicker draft={draft} setDraft={setDraft} />
            ) : activeTarget.field === 'pillarIcons' ? (
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
                helper="La numérotation (01, 02…) est automatique. Astuce : dans le texte, appuie sur Entrée pour créer un nouveau paragraphe."
              />
            ) : activeTarget.field === 'faqs' ? (
              <PairListEditor
                draft={draft}
                setDraft={setDraft}
                firstLabel="Question"
                secondLabel="Réponse"
                addLabel="Ajouter une question"
                helper="Astuce : dans la réponse, appuie sur Entrée pour créer un nouveau paragraphe."
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
