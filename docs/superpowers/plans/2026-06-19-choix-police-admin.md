# Choix de police en mode admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin de choisir, par page de soin, la police des grands titres, des sous-titres/labels et des paragraphes parmi les 5 polices déjà installées.

**Architecture:** 3 champs de police (`titleFont`, `labelFont`, `bodyFont`) stockés dans le JSON `Offering.landingContent` (comme les textes/images actuels). Le template pose 3 variables CSS (`--ff-titre`, `--ff-label`, `--ff-corps`) sur l'`<article>` racine ; des classes utilitaires `.ff-*` les consomment avec un repli identique au design actuel. Le pupitre d'édition gagne un sélecteur visuel de police.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript, CSS pur (globals.css), Prisma (champ JSON existant — aucune migration), tests via `tsx` + `node:assert/strict`.

## Global Constraints

- Tout en français (UI, commits, commentaires) — convention projet.
- Aucune migration de base de données : `Offering.landingContent` (JSON) existe déjà.
- 5 polices autorisées uniquement : `cinzel-decorative`, `cinzel`, `cormorant`, `philosopher`, `medieval`.
- Sans aucun override, le rendu doit rester **identique** à l'actuel (repli CSS).
- Ne PAS modifier la police `font-philosopher` des textes meta (prix, durée).
- Après chaque tâche complétée : `git add` + `git commit` (message clair en français).

---

### Task 1 : Modèle, défauts et validation des polices (`service-landing.ts`)

**Files:**
- Modify: `src/lib/service-landing.ts`
- Test: `src/lib/service-landing.test.ts`

**Interfaces:**
- Produces :
  - `export const FONTS` — `Record<FontKey, { label: string; css: string }>`
  - `export type FontKey` — union des 5 clés
  - `export const FONT_KEYS: FontKey[]`
  - `export const FONT_FIELDS = ['titleFont','labelFont','bodyFont'] as const`
  - `export type FontField = (typeof FONT_FIELDS)[number]`
  - `ServiceLandingContent` gagne `titleFont/labelFont/bodyFont: FontKey`
  - `ServiceLandingOverrides` gagne `titleFont/labelFont/bodyFont?: FontKey`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `src/lib/service-landing.test.ts`, AVANT la ligne `console.log('service-landing tests passed');` (déplacer ce log tout en bas après les nouveaux asserts) :

```ts
// --- Polices : valeurs par défaut ---
assert.equal(content.titleFont, 'cinzel-decorative');
assert.equal(content.labelFont, 'cinzel');
assert.equal(content.bodyFont, 'cormorant');

// --- Polices : parseLandingOverrides conserve une clé valide, ignore une invalide ---
const fontOverrides = parseLandingOverrides({ titleFont: 'medieval', labelFont: 'pas-une-police' });
assert.equal(fontOverrides.titleFont, 'medieval');
assert.equal(fontOverrides.labelFont, undefined);

// --- Polices : override appliqué, champ non surchargé garde le défaut ---
const themedOffering: OfferingView = {
  ...soinRituel,
  landing: { titleFont: 'medieval', bodyFont: 'philosopher' },
};
const themed = buildServiceLandingContent(themedOffering);
assert.equal(themed.titleFont, 'medieval');
assert.equal(themed.bodyFont, 'philosopher');
assert.equal(themed.labelFont, 'cinzel');
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `npx tsx src/lib/service-landing.test.ts`
Expected: ÉCHEC (TypeScript : `titleFont` n'existe pas sur le type, ou assertion échoue).

- [ ] **Step 3 : Ajouter les constantes de police**

Dans `src/lib/service-landing.ts`, juste après `DEFAULT_PILLAR_RUNES` (autour de la ligne 45), ajouter :

```ts
/** Polices disponibles dans le projet (chargées dans layout.tsx). */
export const FONTS = {
  'cinzel-decorative': { label: 'Cinzel Decorative', css: "'Cinzel Decorative', serif" },
  cinzel: { label: 'Cinzel', css: "'Cinzel', serif" },
  cormorant: { label: 'Cormorant Garamond', css: "'Cormorant Garamond', serif" },
  philosopher: { label: 'Philosopher', css: "'Philosopher', sans-serif" },
  medieval: { label: 'MedievalSharp', css: "'MedievalSharp', cursive" },
} as const;

export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

/** Les 3 réglages de police surchargeables (catégories de texte). */
export const FONT_FIELDS = ['titleFont', 'labelFont', 'bodyFont'] as const;
export type FontField = (typeof FONT_FIELDS)[number];

/** Police par défaut de chaque catégorie (rendu identique à l'actuel). */
export const DEFAULT_FONTS: Record<FontField, FontKey> = {
  titleFont: 'cinzel-decorative',
  labelFont: 'cinzel',
  bodyFont: 'cormorant',
};

function isFontKey(value: unknown): value is FontKey {
  return typeof value === 'string' && value in FONTS;
}
```

- [ ] **Step 4 : Ajouter les champs aux interfaces**

Dans `interface ServiceLandingContent` (après `ogImage: string;`, avant la `}` fermante) :

```ts
  /** Police des grands titres (H1 + titres de sections). */
  titleFont: FontKey;
  /** Police des sous-titres et labels. */
  labelFont: FontKey;
  /** Police des paragraphes. */
  bodyFont: FontKey;
```

Dans `interface ServiceLandingOverrides` (après `ogImage?: string;`, avant la `}`) :

```ts
  titleFont?: FontKey;
  labelFont?: FontKey;
  bodyFont?: FontKey;
```

- [ ] **Step 5 : Valider les polices dans `parseLandingOverrides`**

Dans `parseLandingOverrides`, juste avant `return out;`, ajouter :

```ts
  for (const field of FONT_FIELDS) {
    if (isFontKey(source[field])) out[field] = source[field] as FontKey;
  }
```

- [ ] **Step 6 : Appliquer les overrides dans `applyOverrides`**

Dans `applyOverrides`, dans l'objet retourné, après `ogImage: overrides.ogImage ?? base.ogImage,` ajouter :

```ts
    titleFont: overrides.titleFont ?? base.titleFont,
    labelFont: overrides.labelFont ?? base.labelFont,
    bodyFont: overrides.bodyFont ?? base.bodyFont,
```

- [ ] **Step 7 : Ajouter les défauts dans `buildDefaultLandingContent` (2 branches)**

Dans `buildDefaultLandingContent`, dans le `return { ... }` de la branche `if (isSoinRituel)` ET dans le `return { ... }` de la branche générique, ajouter à chaque fois après `ogImage: '',` :

```ts
      titleFont: DEFAULT_FONTS.titleFont,
      labelFont: DEFAULT_FONTS.labelFont,
      bodyFont: DEFAULT_FONTS.bodyFont,
```

(Respecter l'indentation de chaque branche.)

- [ ] **Step 8 : Lancer le test pour vérifier le succès**

Run: `npx tsx src/lib/service-landing.test.ts`
Expected: `service-landing tests passed`

- [ ] **Step 9 : Commit**

```bash
git add src/lib/service-landing.ts src/lib/service-landing.test.ts
git commit -m "feat(polices): modele, defauts et validation des 3 champs de police"
```

---

### Task 2 : Accepter les champs de police dans l'API (`landing/route.ts`)

**Files:**
- Modify: `src/app/api/admin/offerings/[id]/landing/route.ts`

**Interfaces:**
- Consumes : `FONT_FIELDS` (Task 1).

- [ ] **Step 1 : Importer `FONT_FIELDS`**

Modifier l'import depuis `@/lib/service-landing` pour inclure `FONT_FIELDS` :

```ts
import {
  LANDING_TEXT_FIELDS,
  LANDING_LIST_FIELDS,
  FONT_FIELDS,
  parseLandingOverrides,
} from '@/lib/service-landing';
```

- [ ] **Step 2 : Ajouter la boucle de validation des polices**

Juste après la boucle `for (const field of LANDING_LIST_FIELDS) { ... }` (et avant le bloc `if (Object.keys(landingPatch).length > 0)`), ajouter :

```ts
  for (const field of FONT_FIELDS) {
    if (!(field in body)) continue;
    if (typeof body[field] !== 'string') {
      return NextResponse.json({ error: `Le champ ${field} doit etre du texte.` }, { status: 400 });
    }
    landingPatch[field] = body[field];
  }
```

(La clé est ensuite validée par `parseLandingOverrides` lors du merge : une valeur non autorisée est ignorée.)

- [ ] **Step 3 : Vérifier que le projet compile**

Run: `npx tsc --noEmit`
Expected: aucune erreur liée à `route.ts` / `service-landing`.

- [ ] **Step 4 : Commit**

```bash
git add "src/app/api/admin/offerings/[id]/landing/route.ts"
git commit -m "feat(polices): accepter les champs de police dans l'API landing"
```

---

### Task 3 : Classes CSS + application des variables dans le template

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/services/ServiceLandingTemplate.tsx`

**Interfaces:**
- Consumes : `FONTS`, `ServiceLandingContent.titleFont/labelFont/bodyFont` (Task 1).
- Produces : classes CSS `.ff-titre`, `.ff-label`, `.ff-corps` ; variables `--ff-titre/--ff-label/--ff-corps` sur l'`<article>`.

- [ ] **Step 1 : Ajouter les classes utilitaires dans `globals.css`**

Dans `src/app/globals.css`, juste après le bloc `.font-medieval { ... }` (ligne ~171), ajouter :

```css
/* ============================================
   Polices pilotables par l'admin (variables CSS).
   Repli = police par défaut actuelle → rendu identique sans override.
   ============================================ */
.ff-titre {
  font-family: var(--ff-titre, 'Cinzel Decorative', serif);
}

.ff-label {
  font-family: var(--ff-label, 'Cinzel', serif);
}

.ff-corps {
  font-family: var(--ff-corps, 'Cormorant Garamond', serif);
}
```

- [ ] **Step 2 : Importer `FONTS` dans le template**

Dans `src/components/services/ServiceLandingTemplate.tsx`, modifier l'import depuis `@/lib/service-landing` :

```ts
import { buildServiceJsonLd, buildServiceLandingContent, FONTS } from '@/lib/service-landing';
```

- [ ] **Step 3 : Poser les variables CSS sur l'`<article>`**

Remplacer l'ouverture de l'`<article>` (dans la const `body`) :

```tsx
    <article className="overflow-hidden bg-[#050711] text-parchemin">
```

par :

```tsx
    <article
      className="overflow-hidden bg-[#050711] text-parchemin"
      style={
        {
          '--ff-titre': FONTS[content.titleFont].css,
          '--ff-label': FONTS[content.labelFont].css,
          '--ff-corps': FONTS[content.bodyFont].css,
        } as React.CSSProperties
      }
    >
```

- [ ] **Step 4 : Remplacer les classes de police par les classes pilotables**

Dans CE fichier uniquement (`ServiceLandingTemplate.tsx`), remplacer toutes les occurrences, **dans cet ordre** (decorative d'abord) :

1. `font-cinzel-decorative` → `ff-titre`
2. `font-cinzel` → `ff-label`  (les `font-cinzel-decorative` ayant déjà été remplacés)
3. `font-cormorant` → `ff-corps`

Ne PAS toucher `font-philosopher`. Vérifier après remplacement qu'il ne reste plus aucun `font-cinzel` ni `font-cormorant` dans le fichier :

Run: `grep -nE "font-cinzel|font-cormorant" src/components/services/ServiceLandingTemplate.tsx`
Expected: aucune ligne (sortie vide).

- [ ] **Step 5 : Ajouter les boutons ✦ de police près des textes représentatifs**

Dans la fonction `heroText`, ajouter les 3 boutons :

Dans le `<div className="relative mt-5">` du titre, après le bouton `name` :
```tsx
        {canEdit && <ArcaneFieldButton field="titleFont" label="Police des grands titres" position="-left-3 -top-3" />}
```

Dans le `<div className="relative mt-7 max-w-xl">` du sous-titre, après le bouton `subtitle` :
```tsx
        {canEdit && <ArcaneFieldButton field="labelFont" label="Police des sous-titres et labels" position="-left-3 -top-3" />}
```

Dans le `<div className="relative mt-6 max-w-xl">` de l'intro, après le bouton `intro` :
```tsx
        {canEdit && <ArcaneFieldButton field="bodyFont" label="Police des paragraphes" position="-left-3 -top-3" />}
```

- [ ] **Step 6 : Ajouter les 3 cibles d'édition**

Dans le tableau `targets={[ ... ]}` de `ArcaneEditorProvider`, ajouter (par ex. juste après la cible `name`) :

```tsx
        { field: 'titleFont', label: 'Police des grands titres', value: content.titleFont },
        { field: 'labelFont', label: 'Police des sous-titres et labels', value: content.labelFont },
        { field: 'bodyFont', label: 'Police des paragraphes', value: content.bodyFont },
```

- [ ] **Step 7 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur. (Note : `ArcaneFieldButton`/`field` accepteront `titleFont`… après Task 4 ; si `tsc` signale un type `field` invalide ici, c'est attendu et résolu en Task 4 — l'ordre d'exécution Task 4 peut être inversé avec Task 3 si besoin.)

- [ ] **Step 8 : Commit**

```bash
git add src/app/globals.css src/components/services/ServiceLandingTemplate.tsx
git commit -m "feat(polices): variables CSS pilotables + boutons de police dans le template"
```

---

### Task 4 : Sélecteur visuel de police dans le pupitre (`ArcaneInlineEditor.tsx`)

**Files:**
- Modify: `src/components/services/ArcaneInlineEditor.tsx`

**Interfaces:**
- Consumes : `FONTS`, `FONT_KEYS`, `FONT_FIELDS`, `FontKey` (Task 1).

- [ ] **Step 1 : Importer les constantes de police**

En haut de `src/components/services/ArcaneInlineEditor.tsx`, ajouter :

```ts
import { FONTS, FONT_KEYS, FONT_FIELDS } from '@/lib/service-landing';
```

- [ ] **Step 2 : Étendre le type `EditableField`**

Modifier la définition de `EditableField` pour inclure les champs de police :

```ts
type FontField = 'titleFont' | 'labelFont' | 'bodyFont';
type EditableField =
  | ColumnField
  | LandingTextField
  | FontField
  | 'steps'
  | 'faqs'
  | 'pillarRunes'
  | 'pillarIcons'
  | 'benefits';
```

Ajouter aussi un ensemble de détection, près de `IMAGE_FIELDS` :

```ts
const FONT_FIELD_SET: ReadonlySet<EditableField> = new Set(FONT_FIELDS);
```

- [ ] **Step 3 : Créer le composant `FontPicker`**

Ajouter ce composant avant `ArcaneEditorProvider` (par ex. après `PairListEditor`) :

```tsx
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
```

- [ ] **Step 4 : Brancher `FontPicker` dans le panneau**

Dans `ArcaneEditorProvider`, dans la cascade de rendu du pupitre, ajouter une branche `FontPicker` AVANT la branche `pillarIcons`. Remplacer :

```tsx
            {activeTarget.field === 'pillarIcons' ? (
```

par :

```tsx
            {FONT_FIELD_SET.has(activeTarget.field) ? (
              <FontPicker draft={draft} setDraft={setDraft} />
            ) : activeTarget.field === 'pillarIcons' ? (
```

(`buildPayload` retourne déjà `{ [field]: draft }` pour ces champs — aucun cas spécial à ajouter.)

- [ ] **Step 5 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (les `field="titleFont"`… de Task 3 sont maintenant typés correctement).

- [ ] **Step 6 : Vérification manuelle (dev)**

Run: `npm run dev`
Puis, connecté en admin, ouvrir `/seances/soin-rituel` :
1. Vérifier que 3 boutons ✦ « Police… » apparaissent près du titre, du sous-titre et de l'intro.
2. Cliquer « Police des grands titres » → le pupitre montre 5 polices, chacune dans son propre style.
3. Choisir « MedievalSharp » → « Sceller » → le grand titre et les titres de sections changent de police.
4. Recharger la page (mode public, déconnecté) → la police choisie persiste.
5. Vérifier qu'une page sans override (autre soin) garde le rendu d'origine.

- [ ] **Step 7 : Commit**

```bash
git add src/components/services/ArcaneInlineEditor.tsx
git commit -m "feat(polices): selecteur visuel de police dans le pupitre d'edition"
```

---

## Vérification finale

- [ ] `npx tsx src/lib/service-landing.test.ts` → `service-landing tests passed`
- [ ] `npx tsc --noEmit` → aucune erreur
- [ ] `npm run lint` → aucune nouvelle erreur
- [ ] `npm run build` → build réussi
- [ ] Vérification manuelle Task 4 / Step 6 OK
- [ ] `git push` (déclenche le déploiement Vercel) — après accord utilisateur

## Couverture de la spec

- 3 catégories de police (titres / labels / paragraphes) → Tasks 1, 3.
- Stockage par page dans `landingContent`, aucune migration → Tasks 1, 2.
- Validation des 5 clés autorisées → Tasks 1, 2.
- Variables CSS + repli identique à l'actuel → Task 3.
- Sélecteur visuel (aperçu dans chaque police) → Task 4.
- Boutons ✦ dans le template → Task 3.
- Tests (défauts, parse valide/invalide, override appliqué) → Task 1.
- Hors-scope (global, upload, meta, taille/graisse) → non implémenté (conforme).
