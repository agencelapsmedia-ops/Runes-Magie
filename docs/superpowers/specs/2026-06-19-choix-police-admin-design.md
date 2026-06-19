# Choix de police en mode admin (par page de soin)

**Date :** 2026-06-19
**Statut :** Design validé
**Auteur :** Noctura / Laps Media (via Claude)

## Objectif

Permettre à l'administrateur, depuis le « Mode édition des arcanes » des pages de
soin, de choisir la police de caractères parmi les 5 polices déjà installées dans
le projet. Le choix se fait **par page de soin** (stocké dans `Offering.landingContent`).

## Polices disponibles (déjà chargées)

Chargées depuis Google Fonts dans `src/app/layout.tsx` et déclarées dans
`tailwind.config.ts` :

| Clé        | Famille CSS              | Classe Tailwind actuelle  |
|------------|--------------------------|---------------------------|
| `cinzel-decorative` | `'Cinzel Decorative', serif` | `font-cinzel-decorative` |
| `cinzel`   | `'Cinzel', serif`        | `font-cinzel`             |
| `cormorant`| `'Cormorant Garamond', serif` | `font-cormorant`     |
| `philosopher` | `'Philosopher', sans-serif` | `font-philosopher`   |
| `medieval` | `'MedievalSharp', cursive` | `font-medieval`         |

Aucune nouvelle police n'est ajoutée. Aucun upload de police.

## Portée : 3 catégories de texte

L'admin contrôle 3 réglages de police, chacun appliqué à un groupe de textes :

| Réglage (clé champ) | Défaut | Textes concernés |
|---------------------|--------|------------------|
| **Grands titres** (`titleFont`) | `cinzel-decorative` | grand titre H1, titres de sections (sanctuaire, bienfaits, étapes, FAQ, appel final), numéros de bienfaits, runes des piliers |
| **Sous-titres & labels** (`labelFont`) | `cinzel` | eyebrow, sous-titre, titres d'étapes, labels des piliers, labels des bienfaits, questions FAQ |
| **Paragraphes** (`bodyFont`) | `cormorant` | intro, texte du sanctuaire, descriptions d'étapes, réponses FAQ, texte final |

**Hors portée (volontaire / YAGNI) :**
- La police `font-philosopher` des petits textes meta (prix, durée) reste fixe.
- Pas d'upload de polices : seulement les 5 existantes.
- Pas de réglage global site-wide (pourra être ajouté plus tard sans rien jeter).

## Architecture

### 1. Modèle de données

Trois nouveaux champs optionnels dans les overrides, stockés dans le JSON
`Offering.landingContent` (aucune migration DB — la colonne existe déjà).

`ServiceLandingOverrides` (dans `src/lib/service-landing.ts`) :
```ts
titleFont?: FontKey;
labelFont?: FontKey;
bodyFont?: FontKey;
```

`ServiceLandingContent` reçoit les mêmes champs **non optionnels** avec valeur par
défaut résolue :
```ts
titleFont: FontKey;  // défaut 'cinzel-decorative'
labelFont: FontKey;  // défaut 'cinzel'
bodyFont: FontKey;   // défaut 'cormorant'
```

`FontKey` = union des 5 clés autorisées. Une constante `FONTS` mappe chaque clé à :
- son libellé d'affichage (« Cinzel Decorative »),
- sa famille CSS (`'Cinzel Decorative', serif`).

### 2. Validation

- Nouvelle constante `FONT_FIELDS = ['titleFont', 'labelFont', 'bodyFont']`.
- `parseLandingOverrides` : pour chaque champ de police, ne conserver la valeur que
  si c'est une `FontKey` valide (sinon on l'ignore → retour au défaut). Empêche le
  stockage de valeurs arbitraires.
- `applyOverrides` : `titleFont: overrides.titleFont ?? base.titleFont`, idem pour
  les deux autres.
- API `PATCH /api/admin/offerings/[id]/landing` : ajouter une boucle sur
  `FONT_FIELDS` (validation `typeof string` + champ présent), symétrique à celle de
  `LANDING_TEXT_FIELDS`, qui pousse la valeur dans `landingPatch`. La validation de
  clé finale est faite par `parseLandingOverrides` (déjà appelé sur le merge).

### 3. Application des polices dans le rendu

Plutôt que de remplacer ~30 classes `font-*` codées en dur une par une, on pose
**3 variables CSS** sur l'élément racine `<article>` du template, calculées depuis
le contenu résolu :

```tsx
<article
  style={{
    '--ff-titre': FONTS[content.titleFont].css,
    '--ff-label': FONTS[content.labelFont].css,
    '--ff-corps': FONTS[content.bodyFont].css,
  } as React.CSSProperties}
>
```

Dans `globals.css`, trois classes utilitaires consomment ces variables avec un
repli identique au design actuel :
```css
.ff-titre { font-family: var(--ff-titre, 'Cinzel Decorative', serif); }
.ff-label { font-family: var(--ff-label, 'Cinzel', serif); }
.ff-corps { font-family: var(--ff-corps, 'Cormorant Garamond', serif); }
```

Dans `ServiceLandingTemplate.tsx`, remplacer :
- `font-cinzel-decorative` → `ff-titre` (titres concernés uniquement),
- `font-cinzel` → `ff-label` (labels concernés),
- `font-cormorant` → `ff-corps` (paragraphes concernés).

Le repli des variables CSS garantit que, sans aucun override, le rendu est
**identique à l'actuel**.

> Note : les variables sont sur `<article>`, qui englobe le hero ET le corps, donc
> tout est couvert, en mode admin comme en mode public.

### 4. Interface du pupitre (`ArcaneInlineEditor.tsx`)

- Nouveau type de champ `font` (les 3 champs de police).
- Nouveau composant `FontPicker` : affiche les 5 polices en boutons, **chaque
  bouton écrit dans sa propre police** (aperçu visuel), la police active surlignée.
  La valeur retenue (`draft`) est la `FontKey`.
- `buildPayload` : aucun cas spécial — `{ [field]: draft }` (la clé string) convient.
- Le panneau (`ArcaneEditorProvider`) route vers `FontPicker` quand
  `activeTarget.field` est un champ de police.

### 5. Boutons ✦ dans le template

Ajouter 3 cibles d'édition dans le tableau `targets` de `ServiceLandingTemplate`
(`titleFont`, `labelFont`, `bodyFont`) avec libellés clairs, et 3 boutons
`ArcaneFieldButton` accessibles. Placement proposé : regroupés près du grand titre
(ex. positions décalées) ou via un petit bloc « Polices » — détail tranché au plan.

## Flux de données

1. Admin clique un bouton ✦ de police → ouvre `FontPicker` dans le pupitre.
2. Admin choisit une police → `draft = FontKey`.
3. « Sceller » → `PATCH` avec `{ titleFont: 'medieval' }` (par ex.).
4. API valide, merge dans `landingContent`, `revalidatePath`.
5. `router.refresh()` → la page rerend avec les nouvelles variables CSS.

## Gestion des erreurs

- Clé de police invalide envoyée à l'API → ignorée par `parseLandingOverrides`
  (retour silencieux au défaut), pas de 500.
- Champ vide / absent → police par défaut conservée (repli CSS).
- Erreur réseau au `PATCH` → message d'erreur existant du pupitre réutilisé.

## Tests

`src/lib/service-landing.test.ts` (fichier existant) — ajouter :
- `parseLandingOverrides` conserve une `FontKey` valide.
- `parseLandingOverrides` ignore une valeur de police invalide.
- `applyOverrides` / `buildServiceLandingContent` : défauts corrects quand aucun
  override ; override appliqué quand présent.

## Hors-scope confirmé

- Réglage de police global au site.
- Ajout/upload de nouvelles polices.
- Changement de la police des textes meta (prix, durée).
- Taille / graisse / interlignage personnalisables (seulement la famille).
