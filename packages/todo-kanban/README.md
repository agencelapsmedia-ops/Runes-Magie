# 🗂️ Kit To-do Kanban (réutilisable)

Un module de tâches complet, prêt à déposer sur **n'importe quel site Next.js** (App Router + Prisma/Postgres). Extrait du site Runes & Magie.

## Ce que ça fait

- Tableau **kanban à 4 colonnes** : À faire · En cours · En vérification · Terminé
- **Glisser-déposer** des cartes d'une étape à l'autre
- **Priorités** (🔴 Urgente / 🟠 Haute / 🟡 Moyenne / ⚪ Basse) avec tri automatique
- **Étiquettes** de catégorie + **filtres** (par étiquette, par priorité)
- **Assignation** par nom · **dates** début/échéance · badge **⚠ En retard** automatique
- **Notes** de texte et **fichiers joints** par tâche (images, PDF, Word, Excel… 10 Mo)
- **Archivage** et suppression
- Styles **intégrés** (aucune dépendance CSS/thème) — s'affiche pareil partout

## Pré-requis du site hôte

- Next.js (App Router) + React
- Prisma + une base **Postgres**
- Un moyen d'authentifier l'admin (n'importe lequel)
- Un moyen de stocker des fichiers (Supabase, S3, disque…) — **optionnel** (sans lui, tout marche sauf les pièces jointes)

## Installation (5 étapes)

### 1. Copier les fichiers
Copie le contenu de `src/` du kit dans le `src/` de ton site :
```
src/lib/todo-adapters.ts
src/components/TodoBoard.tsx
src/app/api/admin/todos/route.ts
src/app/api/admin/todos/[id]/route.ts
src/app/api/admin/todos/[id]/notes/route.ts
src/app/api/admin/todos/[id]/attachments/route.ts
```

### 2. Ajouter les modèles à la base
Colle les 3 modèles de `prisma/schema-todo.prisma` à la fin de ton `prisma/schema.prisma`.

### 3. Créer les tables
```bash
npx prisma migrate dev --name add_todo_kanban
```
(ou, si tu gères le SQL à la main, exécute `prisma/migration.sql`.)

### 4. Brancher « les 3 prises »
Ouvre **`src/lib/todo-adapters.ts`** — c'est le **seul** fichier à adapter. Il expose 3 choses ; branche-les sur ton site :

| Prise | Contrat | Exemple (Runes & Magie) |
|---|---|---|
| `prisma` | ton client Prisma | `export { prisma } from '@/lib/db';` |
| `requireAdmin()` | `() => Promise<Response \| null>` (Response si NON admin, `null` sinon) | `export { requireAdmin } from '@/lib/admin-guard';` |
| `uploadFile(file, folder?)` | `(File, string?) => Promise<string>` (URL publique) | `export { uploadFile } from '@/lib/supabase';` |

Le fichier contient un exemple complet en commentaire si ton site n'a pas déjà ces fonctions.

### 5. Afficher le tableau
Crée une page admin qui monte le composant, ex. `src/app/admin/todo/page.tsx` :
```tsx
import TodoBoard from '@/components/TodoBoard';
export default function Page() {
  return <TodoBoard />;
}
```
(Protège cette page comme le reste de ton back-office.)

C'est tout — ouvre la page et crée ta première tâche. ✅

## Personnalisation rapide

- **Chemin des API** : si tu montes les routes ailleurs que `/api/admin/todos`, change la constante `API` en tête de `TodoBoard.tsx`.
- **Noms des colonnes** : tableau `COLUMNS` dans `TodoBoard.tsx` (garde les mêmes `key` que dans les routes API : `A_FAIRE`, `EN_COURS`, `EN_VERIFICATION`, `TERMINE`).
- **Couleurs / priorités** : tableaux `COLUMNS` et `PRIORITIES` dans `TodoBoard.tsx`.
- **Sécurité des fichiers** : dans `attachments/route.ts`, tu peux restreindre les URLs acceptées au domaine de ton stockage.

## Notes techniques

- Les routes utilisent la signature Next.js App Router récente : `params: Promise<{ id: string }>` (avec `await params`). Sur une version plus ancienne de Next, remplace par `params: { id: string }` sans `await`.
- Aucune librairie externe n'est requise (glisser-déposer natif HTML5, styles intégrés).
- Rappels par courriel : non inclus (peut s'ajouter via un cron qui lit les tâches dont `dueOn` est dépassée).

---
*Extrait de Runes & Magie le 2026-07-11. Version 1.*
