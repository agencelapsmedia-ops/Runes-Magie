# Design — Catégories de services : pages Séances & École

**Date :** 2026-06-03
**Statut :** En attente de validation cliente

## Contexte

Le menu principal pointait « Services & Soins » vers `/soins`, une sous-application
holistique séparée (marketplace de praticiens, avec son propre layout et ses tableaux
de bord). Les propres offres de Noctura vivent dans `src/data/services.ts` et sont
rendues sur `/services` — une page **orpheline**, liée nulle part dans la navigation.

Annabelle (Noctura) veut réorganiser ses offres en **catégories**, avec une **page par
catégorie**, et mettre en avant deux pages dans le menu :

- **Séances** — tous les soins (et tirages)
- **École** — tous les cours et toutes les formations, clairement distingués

Distinction métier importante :
- un **cours** = une activité unique (ponctuelle) ;
- une **formation** = un programme qui regroupe **plusieurs cours** en continu.

Sur la page École, cours uniques et formations apparaissent **ensemble** ; cliquer sur
une formation ouvre **sa propre page** listant les cours qui la composent.

## Modèle de données (`src/data/services.ts`)

On **étend la structure statique existante** (pas de base de données — cohérent avec le
pattern actuel, facile à éditer). Ajouts à l'interface `Service` :

```ts
category: 'seances' | 'ecole' | 'animations' | 'ceremonies';
type?: 'cours' | 'formation';        // École uniquement
includedCourses?: string[];          // Formation uniquement → slugs des cours regroupés
```

Classement des 6 services existants :

| Service actuel | category | type |
|---|---|---|
| Le Soin Rituel | `seances` | — |
| Tirage Runes & Cartes combinés | `seances` | — |
| Tirage Simple | `seances` | — |
| Soirée d'Animation | `animations` | — |
| Cérémonies de Noctura | `ceremonies` | — |
| Formations & Cours Privés (#4) | **éclatée** (voir scaffold) | — |

Les catégories `animations` et `ceremonies` sont renseignées dans les données dès
maintenant, mais **leurs pages dédiées viendront plus tard** (hors scope de ce lot).

## Contenu de démarrage (scaffold École)

La fiche #4 est remplacée par du contenu de départ, **que la cliente ajustera ensuite** :

**Cours** (`category: 'ecole'`, `type: 'cours'`, 89.99 $, 60 min — dérivés de #4) :
- `cours-prive` — Cours Privé (session individuelle personnalisée)
- `cours-initiation-runes` — Initiation aux Runes & Futhark ancien
- `cours-lecture-tarot` — Lecture du Tarot
- `cours-magie-cristaux` — Magie des Cristaux & Lithothérapie

**Formation** (`category: 'ecole'`, `type: 'formation'`) :
- `formation-de-base` — Formation de Base
  `includedCourses: ['cours-initiation-runes', 'cours-lecture-tarot', 'cours-magie-cristaux']`

## Pages & routage

Nouvelles routes sous `src/app/` (layout principal + Navbar — comme `/services`) :

| Page | Route | Contenu |
|---|---|---|
| Séances | `/seances` | Liste les services `category === 'seances'` (cartes) |
| Détail séance | `/seances/[slug]` | Fiche détail d'une séance |
| École | `/ecole` | Liste cours (`type:'cours'`) **et** formations (`type:'formation'`) ensemble |
| Détail école | `/ecole/[slug]` | Cours → fiche détail ; Formation → page programme listant `includedCourses` |

- Une **formation** sur `/ecole` est cliquable → `/ecole/[slug]` (vue programme : description
  + liste de ses cours, chaque cours pointant vers sa propre fiche `/ecole/[slug]`).
- Un **cours unique** ouvre sa fiche détail `/ecole/[slug]` (vue simple).

## Composants

Réutiliser le style visuel des cartes de la page `/services` existante.

- `ServiceCard` — carte réutilisable (titre, icône rune, prix, durée, extrait, CTA). Une
  variante affiche un badge « Formation » et un compteur « N cours » pour les formations.
- `ServiceDetailView` — vue détail partagée par séances et cours uniques.
- `FormationDetailView` — vue programme : description de la formation + liste de ses cours
  résolus depuis `includedCourses`.

Helpers de données dans `services.ts` : `getByCategory(category)`,
`getBySlug(slug)`, `getCoursesForFormation(formation)`.

## Menu

**Navbar** (`src/components/layout/Navbar.tsx`) — nouvel ordre :
`Séances · École · Boutique · Runes Vikings · À Propos · Contact`
(« Accueil » déjà retiré ; « Services & Soins → /soins » retiré du menu — `/soins` reste
accessible via les CTA de la page d'accueil et son propre layout.)

**Footer** (`src/components/layout/Footer.tsx`) — aligné sur le menu du haut :
`Séances · École · Boutique · Runes Vikings · À Propos · Infolettre · Contact`.
Pour la cohérence avec le menu du haut, « Accueil » est **retiré du pied de page**
(le logo mène toujours à l'accueil). *À confirmer — la cliente avait gardé l'Accueil du
pied de page lors d'un changement précédent.*

## Hors scope

- Pages dédiées Animations et Cérémonies (catégorisées en données, pages plus tard).
- La sous-application holistique `/soins/*` reste **inchangée**.
- La page `/services` reste **telle quelle** (orpheline, accessible par URL directe) —
  choix confirmé par la cliente (pas de redirection).

## Vérification

1. `npm run dev` (un serveur tourne déjà sur le port 3000) — vérifier via HMR.
2. Menu du haut : affiche Séances · École · Boutique · Runes Vikings · À Propos · Contact,
   dans cet ordre, plus de « Accueil » ni « Services & Soins ».
3. `/seances` : liste Soin Rituel + les 2 tirages ; une carte mène à `/seances/[slug]`.
4. `/ecole` : liste les cours uniques **et** la Formation de Base ensemble ; la formation
   affiche un indicateur « N cours ».
5. Cliquer la Formation de Base → `/ecole/formation-de-base` liste ses 3 cours ; chaque
   cours mène à sa fiche.
6. Pied de page : contient désormais Séances et École.
7. `npm run build` passe (types OK : champs `category`/`type`/`includedCourses`).
